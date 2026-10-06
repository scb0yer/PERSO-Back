const express=require('express');
const {timingSafeEqual}=require('node:crypto');
const mongoose=require('mongoose');
const Student=require('../models/Student');
const weekly=require('../services/weekly-results');
const {currentWeek,monday,result}=require('../services/week-rules');
const router=express.Router();
router.use((req,res,next)=>{
 const key=process.env.ADMIN_API_KEY;
 if(!key||key.length<32||key.startsWith('remplacer-'))return res.status(503).json({error:'Accès administrateur non configuré.'});
 const received=Buffer.from(req.get('x-admin-key')||'');const expected=Buffer.from(key);
 if(received.length!==expected.length||!timingSafeEqual(received,expected))return res.status(403).json({error:'Accès administrateur requis.'});
 next();
});
router.get('/classes/:id/weekly-results',async(req,res,next)=>{
 try{
  const {id}=req.params;const week=req.query.week||currentWeek();
  if(!/^[a-f\d]{24}$/i.test(id)||typeof week!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(week)||isNaN(Date.parse(week))||monday(week)!==week||week>currentWeek())
   return res.status(400).json({error:'Classe et date de lundi valides requis (AAAA-MM-JJ), sans semaine future.'});
  const report=await mongoose.connection.transaction(async session=>{
   const classe=await weekly.lockClass(id,session);
   const now=new Date();const classData=await weekly.refreshClass(classe,session,now);
   // Inclut aussi les anciens membres ayant contribué à cette classe dans la semaine.
   const Attempt=require('../models/Attempt');
   const {addDays}=require('../services/week-rules');
   const formerIds=await Attempt.distinct('studentId',{classId:classe._id,rewardDay:{$gte:week,$lt:addDays(week,7)}}).session(session);
   const students=await Student.find({$or:[{classe:classe._id},{_id:{$in:formerIds}}]}).sort({_id:1}).session(session);
   const rows=[];
   for(const item of students){
    const locked=await weekly.lockStudent(item._id,session);
    const data=await weekly.refreshStudent(locked,session,now,classData);
    const value=data.weeklyResults[week]||result(week,0,200,true);
    rows.push({studentId:item._id,name:item.name,currentMember:String(item.classe)===id,...value});
   }
   return {week,classe:{id:classe._id,name:classe.name,...(classData.weeklyResults[week]||result(week,0,2800,false))},students:rows};
  },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
  if(req.query.format==='csv'){
   const cell=value=>'"'+String(value??'').replace(/^(\s*[=+@-]|[\t\r\n])/,"'$1").replaceAll('"','""')+'"';
   const rows=[['Semaine','Élève','Identifiant','Points réels','Participation /20','Accomplissement %','Membre actuel'],
    ...report.students.map(s=>[week,s.name,s.studentId,(s.pointsTenths/10).toLocaleString('fr-FR'),s.gradeOn20.toLocaleString('fr-FR'),s.percentage.toLocaleString('fr-FR'),s.currentMember?'oui':'non'])];
   res.set('Content-Type','text/csv; charset=utf-8');res.set('Content-Disposition',`attachment; filename="participation-${week}.csv"`);
   return res.send('\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n'));
  }
  res.json(report);
 }catch(error){if(error.status)return res.status(error.status).json({error:error.message});next(error);}
});
module.exports=router;
