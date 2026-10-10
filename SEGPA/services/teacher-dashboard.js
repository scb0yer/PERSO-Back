const mongoose=require('mongoose');
const Student=require('../models/Student');
const Attempt=require('../models/Attempt');
const Exercice=require('../models/Exercice');
const Settings=require('../models/TeacherSettings');
const catalog=require('./activity-catalog');
const weekly=require('./weekly-results');
const {currentWeek,addDays,result}=require('./week-rules');
const {historyFor,periodAverages,exerciseStats}=require('./teacher-rules');
module.exports=async function dashboard(classId, selectedWeek) {
  const now=new Date(), current=currentWeek(now), week=selectedWeek||current;
  return mongoose.connection.transaction(async session=>{
    const locked=await weekly.lockClass(classId,session);
    const classe=await weekly.refreshClass(locked,session,now);
    const ids=await Student.find({classe:classId}).select('_id').sort({_id:1}).session(session).lean();
    const students=[];
    for(const {_id} of ids) {
      const student=await weekly.lockStudent(_id,session);
      students.push(await weekly.refreshStudent(student,session,now,classe));
    }
    const startWeek=Object.keys(classe.weeklyResults).sort()[0]||current;
    const settings=await Settings.findOneAndUpdate({classId},{$setOnInsert:{periods:[{name:'Période 1',startWeek}],exclusions:[],revision:0}},
      {upsert:true,new:true,setDefaultsOnInsert:true,session}).lean();
    const periodRows=settings.periods.slice().sort((a,b)=>a.startWeek.localeCompare(b.startWeek));
    settings.periods=periodRows;
    // Fenêtre civile Europe/Paris, y compris les changements d'heure.
    const rows=await Attempt.aggregate([
      {$match:{classId:new mongoose.Types.ObjectId(classId),studentId:{$in:ids.map(s=>s._id)}}},
      {$set:{teacherDay:{$dateToString:{date:'$date',format:'%Y-%m-%d',timezone:'Europe/Paris'}}}},
      {$match:{teacherDay:{$gte:week,$lt:addDays(week,7)}}},
      {$group:{_id:{exercise:'$exerciceId',student:'$studentId'},count:{$sum:1},success:{$avg:{$cond:[{$gt:['$maxScore',0]},{$divide:['$score','$maxScore']},null]}}}},
    ]).session(session);
    const exerciseIds=[...new Set([...catalog.map(c=>c.exerciceId),...rows.map(r=>String(r._id.exercise))])];
    const exercises=await Exercice.find({_id:{$in:exerciseIds}}).select('name area subject').sort({area:1,name:1}).session(session).lean();
    const pupilRows=students.map(student=>{
      const history=historyFor(student,settings,current);
      return {id:String(student._id),name:student.name,avatar:student.avatar||'',
        weekly:history.find(r=>r.week===week)||result(week,0,200,true),history,
        periods:periodAverages(history,periodRows,current)};
    }).sort((a,b)=>b.weekly.gradeOn20-a.weekly.gradeOn20 || a.name.localeCompare(b.name,'fr'));
    return {currentWeek:current,week,classe:{id:String(classe._id),name:classe.name,studentCount:students.length,
      weekly:classe.weeklyResults[week]||result(week,0,2800,false)},students:pupilRows,
      exercises:exerciseStats(exercises,rows,students.length),settings:{revision:settings.revision,periods:periodRows,exclusions:settings.exclusions}};
  },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
};
