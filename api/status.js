const {validSession}=require("../lib/auth");
const {getDb}=require("../lib/firebase");
module.exports=async(req,res)=>{
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed."});}
 if(!validSession(req))return res.status(401).json({error:"Access code required."});
 try{const s=await getDb().collection("jambtrack").doc("current").get();if(!s.exists)return res.status(200).json({success:false,error:"No successful Termux sync received yet."});return res.status(200).json(s.data());}
 catch(e){console.error(e.message);return res.status(503).json({error:"Admission data temporarily unavailable."});}
};
