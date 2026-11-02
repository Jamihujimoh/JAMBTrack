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

function stable(v) {
  if (Array.isArray(v)) return v.map(stable);
  if (!v || typeof v !== "object") return v;

  const skip = new Set([
    "checked_at", "last_seen", "last_updated",
    "last_successful_update", "retrieved_at",
    "saved_at", "timestamp", "agent", "last_processed"
  ]);

  const out = {};
  for (const k of Object.keys(v).sort()) {
    if (!skip.has(k)) out[k] = stable(v[k]);
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

    // Map the actual Termux JSON structure.
    const regular = d.regular_admission || d.regular || {};
    const transfer = d.transfer_approval ||
      d.transfer_admission ||
      d.transfer || {};

    const incoming = {
      candidate: d.candidate || {},

      regular_admission: {
        ...regular,
        reg_number: regular.reg_number || regular.jamb_registration || "",
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

      refresh_errors: Array.isArray(d.refresh_errors)
        ? d.refresh_errors
        : [],

      last_processed: d.last_processed || null
    };

    const hasRegular =
      Object.keys(regular).length > 0;

    const hasTransfer =
      Object.keys(transfer).length > 0;

    if (!hasRegular && !hasTransfer) {
      throw new Error("No admission information found in jamb_data.json.");
    }

    const db = getDb();
    const ref = db.collection("jambtrack").doc("current");
    const snap = await ref.get();
    const old = snap.exists ? snap.data() : {};

    // Preserve previous successful information if a section is empty.
    for (const key of [
      "candidate",
      "regular_admission",
      "transfer_admission"
    ]) {
      if (!incoming[key] || !Object.keys(incoming[key]).length) {
        incoming[key] = old[key] || {};
      }
    }

    if (
      !Object.keys(incoming.regular_admission).length &&
      !Object.keys(incoming.transfer_admission).length
    ) {
      throw new Error("No successful admission sections available.");
    }

    const now = new Date().toISOString();

    incoming.success = true;
    incoming.fetch_state = "success";
    incoming.last_successful_update = now;
    incoming.agent = {
      status: "online",
      last_seen: now
    };

    const safeIncoming = firestoreSafe(incoming);

    const project = x => stable({
      candidate: x.candidate || {},
      regular_admission: x.regular_admission || {},
      transfer_admission: x.transfer_admission || {},
      page_messages: x.page_messages || []
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
