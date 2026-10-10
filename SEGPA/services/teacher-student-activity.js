const mongoose=require('mongoose');
const Student=require('../models/Student');
const Attempt=require('../models/Attempt');
const Exercice=require('../models/Exercice');
const {validId,percent,encodeCursor,decodeCursor,summarizeExercises}=require('./teacher-activity-rules');
const fail=(status,message)=>Object.assign(new Error(message),{status});
module.exports=async function studentActivity(classId,studentId,cursorValue) {
  if(!validId(studentId))throw fail(400,'Identifiant élève invalide.');
  const cursor=decodeCursor(cursorValue);
  if(!await Student.exists({_id:studentId,classe:classId}))throw fail(404,'Élève introuvable dans cette classe.');
  const pupilId=new mongoose.Types.ObjectId(studentId);
  const query={studentId:pupilId};
  if(cursor)query.$or=[{date:{$lt:cursor.date}},{date:cursor.date,_id:{$lt:new mongoose.Types.ObjectId(cursor.id)}}];
  const found=await Attempt.find(query).select('exerciceId score maxScore date pointsAwardedTenths')
    .sort({date:-1,_id:-1}).limit(21).populate('exerciceId','name area subject').lean();
  const page=found.slice(0,20);
  const response={attempts:page.map(a=>({id:String(a._id),exerciseId:a.exerciceId?String(a.exerciceId._id):null,
    name:a.exerciceId?.name||'Exercice supprimé',area:a.exerciceId?.area||a.exerciceId?.subject||'Mathématiques',
    date:a.date,score:a.score,maxScore:a.maxScore,percentage:percent(a.score,a.maxScore),points:(a.pointsAwardedTenths||0)/10})),
    nextCursor:found.length>20?encodeCursor(page.at(-1)):null};
  if(!cursor) {
    // Les 5 derniers essais de chaque exercice : les anciens échecs ne masquent pas les progrès récents.
    const rows=await Attempt.aggregate([
      {$match:{studentId:pupilId}},
      {$group:{_id:'$exerciceId',attemptCount:{$sum:1},lastDate:{$max:'$date'}}},
      {$lookup:{from:Attempt.collection.name,let:{exercise:'$_id'},pipeline:[
        {$match:{$expr:{$and:[{$eq:['$studentId',pupilId]},{$eq:['$exerciceId','$$exercise']}]}}},
        {$sort:{date:-1,_id:-1}},{$limit:5},{$project:{score:1,maxScore:1}},
      ],as:'recent'}},
      {$lookup:{from:Exercice.collection.name,localField:'_id',foreignField:'_id',as:'exercise'}},
      {$set:{exercise:{$arrayElemAt:['$exercise',0]}}},
    ]);
    response.exercises=summarizeExercises(rows);
    response.totalAttempts=rows.reduce((sum,r)=>sum+r.attemptCount,0);
  }
  return response;
};
