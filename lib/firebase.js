const admin=require("firebase-admin");
function getDb(){
 if(!admin.apps.length){
  const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if(!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON.");
  const account=JSON.parse(raw);
  admin.initializeApp({credential:admin.credential.cert(account),projectId:account.project_id});
 }
 return admin.firestore();
}
module.exports={getDb};
