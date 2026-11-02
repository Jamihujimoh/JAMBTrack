const crypto=require("crypto");
const COOKIE="jambtrack_session", HOURS=12*60*60;
function secret(){const s=process.env.SESSION_SECRET;if(!s||s.length<32)throw new Error("SESSION_SECRET must be at least 32 characters.");return s;}
function equal(a,b){const x=Buffer.from(String(a||"")),y=Buffer.from(String(b||""));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function sign(p){return crypto.createHmac("sha256",secret()).update(p).digest("base64url");}
function cookies(req){const o={};for(const part of (req.headers.cookie||"").split(";")){const i=part.indexOf("=");if(i>0){try{o[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());}catch{}}}return o;}
function createSession(){const p=Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+HOURS})).toString("base64url");return p+"."+sign(p);}
function validSession(req){try{const t=cookies(req)[COOKIE];if(!t)return false;const a=t.split(".");if(a.length!==2||!equal(sign(a[0]),a[1]))return false;return JSON.parse(Buffer.from(a[0],"base64url").toString()).exp>Math.floor(Date.now()/1000);}catch{return false;}}
function cookie(value,age){return `${COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${age}${process.env.NODE_ENV==="production"?"; Secure":""}`;}
function checkCode(v){if(!process.env.ACCESS_CODE)throw new Error("ACCESS_CODE missing.");return equal(v,process.env.ACCESS_CODE);}
function checkSync(req){const h=req.headers.authorization||"",t=process.env.SYNC_TOKEN;return !!t&&h.startsWith("Bearer ")&&equal(h.slice(7),t);}
module.exports={COOKIE,HOURS,createSession,validSession,cookie,checkCode,checkSync};
