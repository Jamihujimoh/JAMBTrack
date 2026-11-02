# JAMBTrack

The supplied HTML dashboard is retained as `index.html`. This project adds a Vercel API and Firebase Admin connection. No Firebase Authentication is used.

## Deploy
1. Create a new GitHub repository named JAMBTrack, separate from Jimskayonline.
2. Upload the contents of this folder to the repository root.
3. Do not upload service-account JSON files, `.env` files, JAMB passwords, cookies or tokens.
4. Import the repository into Vercel.
5. Add the four environment variables below in Vercel Project Settings > Environment Variables, then deploy/redeploy.

## Vercel environment variables
- `ACCESS_CODE`: set this to the access code you chose. It is checked on the server and is not in the HTML.
- `SESSION_SECRET`: a newly generated random string of at least 32 characters.
- `SYNC_TOKEN`: a different long random secret used only by the Termux agent.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: paste the complete JSON text from the service-account key for your separate `jambtrack` Firebase project.

Generate random secrets locally on your PC with Node.js:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Use different values for SESSION_SECRET and SYNC_TOKEN. Never put secrets in frontend files or GitHub. Never send them in chat.

## Firebase
The service-account key must belong to the `jambtrack` project. The backend uses Firebase Admin SDK; the browser does not connect directly to Firestore. Keep Firestore client rules denying all direct client reads/writes.

## Termux sync
Copy `jambtrack_sync.py` into the same Termux directory as `jamb_data.json`. Install requests if needed: `python -m pip install requests`
Then run: `python jambtrack_sync.py https://YOUR-PROJECT.vercel.app`
Enter the SYNC_TOKEN when prompted. The token is not echoed or saved by the script.

The sync endpoint expects `candidate`, `regular_admission`, and/or `transfer_admission` objects (also accepts `regular` and `transfer`). The uploaded HTML did not include `jamb_data.json`, so the exact saved JSON structure has not yet been checked. If the first sync reports an unrecognized structure, we must map the extractor's actual fields before relying on it. Do not share passwords, cookies, private keys or tokens.

## Privacy
Anyone who knows the access code can see the dashboard information, including fields currently shown for candidate name and JAMB registration number. The access code is not a substitute for keeping information private from people who know it. Do not put JAMB credentials in the webpage.

## API
- `POST /api/access`: verifies code and sets a signed 12-hour HttpOnly cookie.
- `GET /api/access`: checks session.
- `DELETE /api/access`: locks browser session.
- `GET /api/status`: returns Firestore current record to an authorized session.
- `POST /api/sync`: accepts Termux updates with `Authorization: Bearer <SYNC_TOKEN>`.
