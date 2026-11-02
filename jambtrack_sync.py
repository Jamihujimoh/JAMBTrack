#!/usr/bin/env python3
"""Upload the local jamb_data.json to JAMBTrack using a private sync token."""
import getpass, json, os, sys
from pathlib import Path
import requests
DATA=Path(__file__).with_name("jamb_data.json")
def main():
 url=(sys.argv[1] if len(sys.argv)>1 else input("JAMBTrack Vercel URL: ")).strip().rstrip("/")
 if not url.startswith("https://"): print("Use the deployed HTTPS Vercel URL."); return 1
 if not DATA.exists(): print(f"Missing {DATA}; keep it beside this script."); return 1
 token=os.environ.get("JAMBTRACK_SYNC_TOKEN") or getpass.getpass("JAMBTrack sync token: ")
 if not token: print("No token supplied."); return 1
 try:
  payload=json.loads(DATA.read_text(encoding="utf-8"))
  r=requests.post(url+"/api/sync",json={"data":payload},headers={"Authorization":"Bearer "+token},timeout=(15,45))
  try: result=r.json()
  except ValueError: result={"error":r.text[:250]}
  if not r.ok: print("Sync failed:",result.get("error",f"HTTP {r.status_code}")); return 1
  print("JAMBTrack sync successful."); print("Admission data changed:", "Yes" if result.get("changed") else "No")
  print("Last successful update:",result.get("last_successful_update","saved")); return 0
 except requests.RequestException as e: print("Network error:",e); return 1
 except (OSError,ValueError) as e: print("Could not read jamb_data.json:",e); return 1
if __name__=="__main__": raise SystemExit(main())
