const crypto = require("crypto");
const { checkSync } = require("../lib/auth");
const { getDb } = require("../lib/firebase");

function firestoreSafe(value) {
  if (Array.isArray(value)) {
    return value.map(item =>
      Array.isArray(item)
        ? { items: item.map(firestoreSafe) }
        : firestoreSafe(item)
    );
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = firestoreSafe(item);
    }
    return out;
  }

  return value;
}

// Preserve old values when incoming values are empty.
function mergeFresh(oldValue, newValue) {
  if (newValue === null || newValue === undefined || newValue === "") {
    return oldValue;
  }

  if (Array.isArray(newValue)) {
    return newValue.length ? newValue : (oldValue ?? newValue);
  }

  if (typeof newValue === "object") {
    const oldObject =
      oldValue && typeof oldValue === "object" && !Array.isArray(oldValue)
        ? oldValue
        : {};

    const result = { ...oldObject };

    for (const [key, value] of Object.entries(newValue)) {
      result[key] = mergeFresh(oldObject[key], value);
    }

    return result;
  }

  return newValue;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;

  const skip = new Set([
    "checked_at", "last_seen", "last_updated",
    "last_successful_update", "retrieved_at",
    "saved_at", "timestamp", "agent", "last_processed"
  ]);

  const out = {};
  for (const key of Object.keys(value).sort()) {
    if (!skip.has(key)) out[key] = stable(value[key]);
  }

  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!checkSync(req)) {
    return res.status(401).json({ error: "Invalid sync token." });
  }

  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body || {};

    const d = body.data && typeof body.data === "object"
      ? body.data
      : body;

    const regular = d.regular_admission || d.regular || {};
    const transfer =
      d.transfer_approval ||
      d.transfer_admission ||
      d.transfer ||
      {};

    // Reject a refresh if any portal section reported an error.
    if (Array.isArray(d.refresh_errors) && d.refresh_errors.length) {
      throw new Error("Refresh contains errors. Previous website data was preserved.");
    }

    // Require all three sections before accepting a new refresh.
    if (
      !d.candidate ||
      !d.candidate.name ||
      !d.candidate.reg_number ||
      !regular ||
      !Object.keys(regular).length ||
      !transfer ||
      !Object.keys(transfer).length
    ) {
      throw new Error("Incomplete refresh. Previous website data was preserved.");
    }

    const regularStatus =
      regular.admission_status ||
      regular.status_text ||
      regular.message;

    const transferStatus =
      transfer.table_text ||
      transfer.status_text ||
      transfer.message;

    if (!regularStatus || !transferStatus) {
      throw new Error("Admission status information is incomplete. Previous website data was preserved.");
    }

    const db = getDb();
    const ref = db.collection("jambtrack").doc("current");
    const snap = await ref.get();
    const old = snap.exists ? snap.data() : {};

    // Map the actual Termux JSON structure.
    const incoming = {
      candidate: d.candidate,
      regular_admission: {
        ...regular,
        reg_number:
          regular.reg_number ||
          regular.jamb_registration ||
          d.candidate.reg_number,
        status_text: regular.status_text || regular.admission_status || "",
        message: regular.message || regular.admission_status || ""
      },
      transfer_admission: {
        ...transfer,
        status_text: transfer.status_text || transfer.table_text || "",
        message: transfer.message || transfer.table_text || ""
      },
      page_messages: Array.isArray(d.page_messages)
        ? d.page_messages
        : [],
      refresh_errors: [],
      last_processed: d.last_processed || null
    };

    // Merge field by field, preserving old valid information.
    incoming.candidate = mergeFresh(old.candidate || {}, incoming.candidate);
    incoming.regular_admission = mergeFresh(
      old.regular_admission || {},
      incoming.regular_admission
    );
    incoming.transfer_admission = mergeFresh(
      old.transfer_admission || {},
      incoming.transfer_admission
    );

    const now = new Date().toISOString();

    incoming.success = true;
    incoming.fetch_state = "success";
    incoming.last_successful_update = now;
    incoming.agent = {
      status: "online",
      last_seen: now
    };

    const safeIncoming = firestoreSafe(incoming);

    const project = value => stable({
      candidate: value.candidate || {},
      regular_admission: value.regular_admission || {},
      transfer_admission: value.transfer_admission || {},
      page_messages: value.page_messages || []
    });

    const changed =
      !snap.exists ||
      JSON.stringify(project(old)) !== JSON.stringify(project(incoming));

    await ref.set(safeIncoming, { merge: true });

    if (changed) {
      await ref.collection("history")
        .doc(crypto.randomUUID())
        .set({
          saved_at: now,
          candidate: safeIncoming.candidate,
          regular_admission: safeIncoming.regular_admission,
          transfer_admission: safeIncoming.transfer_admission
        });
    }

    return res.status(200).json({
      ok: true,
      changed,
      last_successful_update: now
    });

  } catch (e) {
    console.error("sync:", e.message);
    return res.status(400).json({
      error: e.message || "Sync failed."
    });
  }
};
