const express=require('express');
const {rateLimit}=require('express-rate-limit');
const Classe=require('../models/Class');
const Student=require('../models/Student');
const Settings=require('../models/TeacherSettings');
const auth=require('../services/teacher-auth');
const dashboard=require('../services/teacher-dashboard');
const {validWeek}=require('../services/teacher-rules');
const {currentWeek,addDays}=require('../services/week-rules');
const router=express.Router();
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const fail=(status,message)=>Object.assign(new Error(message),{status});
const idValid=id=>typeof id==='string' && /^[a-f0-9]{24}$/i.test(id);
const limiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,
  message:{error:'Trop de tentatives. Réessayez dans 15 minutes.'}});
router.post('/auth/login',limiter,wrap(async(req,res)=>{
  if(!auth.configured())throw fail(503,'Configurez MDP_ADMIN dans le backend (12 caractères minimum).');
  if(!auth.validPassword(req.body?.password))throw fail(401,'Mot de passe incorrect.');
  await new Promise((resolve,reject)=>req.session.regenerate(e=>e?reject(e):resolve()));
  req.session.teacher=true;
  req.session.teacherFingerprint=auth.fingerprint();
  await new Promise((resolve,reject)=>req.session.save(e=>e?reject(e):resolve()));
  res.json({authenticated:true});
}));
router.post('/auth/logout',wrap(async(req,res)=>{
  await new Promise((resolve,reject)=>req.session.destroy(e=>e?reject(e):resolve()));
  res.clearCookie('prof.sid',{path:'/',secure:true,httpOnly:true,sameSite:'none'});
  res.status(204).end();
}));
router.use((req,res,next)=>auth.authenticated(req.session)?next():res.status(401).json({error:'Connexion professeur requise.'}));
router.get('/auth/me',(req,res)=>res.json({authenticated:true}));
router.get('/classes',wrap(async(req,res)=>res.json({classes:await Classe.find().select('_id name').sort({name:1}).lean()})));
router.param('id',(req,res,next,id)=>idValid(id)?next():next(fail(400,'Identifiant de classe invalide.')));
router.get('/classes/:id/dashboard',wrap(async(req,res)=>{
  const week=req.query.week||currentWeek();
  if(!validWeek(week)||week>currentWeek()||week<'2000-01-03')throw fail(400,'Choisissez un lundi passé ou le lundi de cette semaine.');
  res.json(await dashboard(req.params.id,week));
}));
async function settingsFor(req) {
  const settings=await Settings.findOne({classId:req.params.id}).lean();
  if(!settings)throw fail(409,'Ouvrez le tableau de bord de cette classe avant de modifier ses périodes.');
  if(!Number.isInteger(req.body?.revision)||req.body.revision!==settings.revision)throw fail(409,'Les réglages ont changé. Actualisez le tableau de bord.');
  return settings;
}
async function updateSettings(settings,update) {
  const updated=await Settings.findOneAndUpdate({_id:settings._id,revision:settings.revision},{$set:update,$inc:{revision:1}},{new:true}).lean();
  if(!updated)throw fail(409,'Les réglages ont changé. Actualisez le tableau de bord.');
  return {revision:updated.revision};
}
router.post('/classes/:id/periods',wrap(async(req,res)=>{
  const settings=await settingsFor(req), {name,startWeek}=req.body;
  const last=settings.periods.at(-1);
  if(typeof name!=='string'||!name.trim()||name.trim().length>80)throw fail(400,'Nom de période requis (80 caractères maximum).');
  if(!validWeek(startWeek)||startWeek<=last.startWeek||startWeek>addDays(currentWeek(),7))throw fail(400,'Choisissez un lundi après le début de la dernière période, au plus tard lundi prochain.');
  const periods=[...settings.periods,{name:name.trim(),startWeek}];
  res.status(201).json(await updateSettings(settings,{periods}));
}));
// Correction du début de la première période, sans déplacer les périodes suivantes.
router.patch('/classes/:id/first-period',wrap(async(req,res)=>{
  const settings=await settingsFor(req), {startWeek}=req.body;
  if(!validWeek(startWeek)||startWeek<'2000-01-03'||startWeek>currentWeek()||(settings.periods[1]&&startWeek>=settings.periods[1].startWeek))throw fail(400,'Date de début invalide. Choisissez un lundi antérieur à la deuxième période.');
  settings.periods[0].startWeek=startWeek;
  res.json(await updateSettings(settings,{periods:settings.periods}));
}));
router.put('/classes/:id/exclusions',wrap(async(req,res)=>{
  const settings=await settingsFor(req), {studentId,week,excluded}=req.body;
  if(!validWeek(week)||week>currentWeek()||week<'2000-01-03'||typeof excluded!=='boolean')throw fail(400,'Semaine ou exclusion invalide.');
  if(studentId!=='*' && (!idValid(studentId)||!await Student.exists({_id:studentId,classe:req.params.id})))throw fail(400,'Élève introuvable dans cette classe.');
  const exclusions=settings.exclusions.filter(e=>!(e.studentId===studentId && e.week===week));
  if(excluded)exclusions.push({studentId,week});
  res.json(await updateSettings(settings,{exclusions}));
}));
router.use((req,res)=>res.status(404).json({error:'Route professeur introuvable.'}));
router.use((err,req,res,next)=>err.status?res.status(err.status).json({error:err.message}):next(err));
module.exports=router;
