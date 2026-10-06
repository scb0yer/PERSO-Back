const mongoose = require('mongoose');
const Student=require('../models/Student');
const Classe=require('../models/Class');
const Attempt=require('../models/Attempt');
const {buildHistory,currentWeek}=require('./week-rules');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const plain=doc=>doc.toObject({flattenMaps:true});
async function lockClass(classId,session) {
 const classe=await Classe.findOneAndUpdate({_id:classId},{$inc:{pointsRevision:1}},{new:true,session});
 if(!classe) throw fail(404,'Classe introuvable.');
 return classe;
}
async function lockStudent(studentId,session) {
 const student=await Student.findOneAndUpdate({_id:studentId},{$inc:{pointsRevision:1}},{new:true,session});
 if(!student)throw fail(401,'Compte introuvable.');
 return student;
}
async function refreshDocument(Model,document,match,session,now,personal,baseline) {
 const rows=await Attempt.aggregate([
  {$match:{...match,rewardDay:{$type:'string'},pointsRuleVersion:1}},
  {$group:{_id:'$rewardDay',pointsTenths:{$sum:'$pointsAwardedTenths'}}},
 ]).session(session);
 const previous=plain(document).weeklyResults||{};
 if(baseline){
   const first=Object.keys(baseline.weeklyResults||{}).sort()[0];
   if(first&&!previous[first]) previous[first]={targetTenths:200};
 }
 const weeklyResults=buildHistory(rows,previous,now,personal);
 await Model.updateOne({_id:document._id},{$set:{weeklyResults}},{session});
 return {...plain(document),weeklyResults};
}
async function refreshStudent(student,session,now,baseline){return refreshDocument(Student,student,{studentId:student._id},session,now,true,baseline);}
async function refreshClass(classe,session,now){return refreshDocument(Classe,classe,{classId:classe._id},session,now,false);}
function summarize(document,now=new Date()) {
 const week=currentWeek(now);const all=document.weeklyResults||{};
 return {current:all[week],history:Object.values(all).filter(r=>r.week<week).sort((a,b)=>b.week.localeCompare(a.week))};
}
async function dashboardSnapshot(studentId,now=new Date()) {
 return mongoose.connection.transaction(async session=>{
  const seed=await Student.findById(studentId).session(session);
  if(!seed)throw fail(401,'Compte introuvable.');
  // Même ordre de verrouillage que POST /attempt : classe, puis élève.
  const classe=await lockClass(seed.classe,session);
  const student=await lockStudent(studentId,session);
  const classData=await refreshClass(classe,session,now);
  const studentData=await refreshStudent(student,session,now,classData);
  return {student:studentData,classe:classData,referenceAt:now};
 },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
}
module.exports={lockClass,lockStudent,refreshStudent,refreshClass,summarize,dashboardSnapshot};
