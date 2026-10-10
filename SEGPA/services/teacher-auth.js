const crypto=require('crypto');
const digest=s=>crypto.createHash('sha256').update(s).digest();
function configured() { return typeof process.env.MDP_ADMIN==='string' && process.env.MDP_ADMIN.length>=12; }
function validPassword(password) {
  return configured() && typeof password==='string' && password.length<=1024 && crypto.timingSafeEqual(digest(password),digest(process.env.MDP_ADMIN));
}
function fingerprint() {return crypto.createHmac('sha256',process.env.SESSION_SECRET).update(process.env.MDP_ADMIN).digest('hex');}
function authenticated(session) {
  if(!configured() || session?.teacher!==true || typeof session.teacherFingerprint!=='string')return false;
  return crypto.timingSafeEqual(digest(session.teacherFingerprint),digest(fingerprint()));
}
module.exports={configured,validPassword,fingerprint,authenticated};
