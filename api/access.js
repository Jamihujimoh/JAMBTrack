const a=require("../lib/auth");
module.exports=async(req,res)=>{
 res.setHeader("Cache-Control","no-store");
 if(req.method==="GET")return a.validSession(req)?res.status(200).json({ok:true}):res.status(401).json({ok:false});
 if(req.method==="POST"){try{const b=typeof req.body==="string"?JSON.parse(req.body):req.body||{};if(!a.checkCode(b.code))return res.status(401).json({ok:false,error:"Incorrect access code."});res.setHeader("Set-Cookie",a.cookie(a.createSession(),a.HOURS));return res.status(200).json({ok:true});}catch(e){console.error(e.message);return res.status(503).json({ok:false,error:"Access service is not configured."});}}
 if(req.method==="DELETE"){res.setHeader("Set-Cookie",a.cookie("",0));return res.status(200).json({ok:true});}
 res.setHeader("Allow","GET, POST, DELETE");return res.status(405).json({error:"Method not allowed."});
};
