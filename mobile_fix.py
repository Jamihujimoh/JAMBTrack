from pathlib import Path

p = Path("index.html")
html = p.read_text(encoding="utf-8")

css = r"""

/* JAMBTrack mobile improvements */
@media (max-width: 600px) {
  html, body {
    width: 100%;
    max-width: 100%;
    margin: 0;
    overflow-x: hidden;
  }

  * {
    box-sizing: border-box;
  }

  .shell {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
  }

  .sidebar {
    width: 100%;
    min-width: 0;
    padding: 12px;
  }

  .brand {
    padding: 2px 4px 12px;
  }

  .nav {
    display: flex;
    flex-wrap: wrap;
    overflow: visible;
    gap: 6px;
  }

  .nav button {
    flex: 1 1 auto;
    text-align: center;
    white-space: normal;
    min-width: 0;
    padding: 10px 8px;
  }

  main {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin: 0;
    padding: 17px 12px 30px;
  }

  .top {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .top h1 {
    font-size: 23px;
    overflow-wrap: anywhere;
  }

  .actions {
    width: 100%;
  }

  .actions .btn {
    flex: 1 1 auto;
    min-width: 0;
  }

  .syncbar {
    width: 100%;
    align-items: flex-start;
  }

  .right {
    margin-left: 0;
    width: 100%;
  }

  .grid {
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    gap: 12px;
  }

  .card,
  .wide {
    width: 100%;
    min-width: 0;
    grid-column: auto;
  }

  .details {
    grid-template-columns: minmax(0, 1fr);
  }

  .detail,
  .raw {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .formrow {
    width: 100%;
  }

  .formrow input {
    width: 100%;
    min-width: 0;
  }

  .tablewrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
  }

  .history {
    width: 100%;
    min-width: 0;
    table-layout: fixed;
  }

  .history th,
  .history td {
    padding: 8px 5px;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .access-card {
    width: calc(100% - 24px);
    max-width: 420px;
    padding: 22px;
  }

  .toast {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
}
"""

if "JAMBTrack mobile improvements" in html:
    print("Mobile improvements already exist. No changes made.")
elif "</style>" not in html:
    raise SystemExit("Could not find closing style tag. No changes made.")
else:
    html = html.replace("</style>", css + "\n</style>", 1)
    p.write_text(html, encoding="utf-8")
    print("Mobile improvements added successfully.")

