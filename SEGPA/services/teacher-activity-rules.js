const validId=value=>typeof value==='string' && /^[a-f0-9]{24}$/i.test(value);
const percent=(score,maxScore)=>typeof score==='number' && typeof maxScore==='number' && maxScore>0 ? Math.round(score/maxScore*10000)/100 : null;
function encodeCursor(attempt) {
  return Buffer.from(JSON.stringify({date:new Date(attempt.date).toISOString(),id:String(attempt._id)})).toString('base64url');
}
function decodeCursor(value) {
  if(value==null)return null;
  try {
    if(typeof value!=='string'||value.length>300||!/^[A-Za-z0-9_-]+$/.test(value))throw Error();
    const parsed=JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
    if(!validId(parsed.id)||typeof parsed.date!=='string'||new Date(parsed.date).toISOString()!==parsed.date)throw Error();
    return {date:new Date(parsed.date),id:parsed.id};
  }catch {throw Object.assign(new Error('Pagination invalide. Rechargez la fiche élève.'),{status:400});}
}
function summarizeExercises(rows) {
  return rows.map(row=>{
    const recent=row.recent.filter(a=>percent(a.score,a.maxScore)!=null);
    const mean=recent.length ? recent.reduce((sum,a)=>sum+a.score/a.maxScore*100,0)/recent.length : null;
    return {id:String(row._id),name:row.exercise?.name||'Exercice supprimé',area:row.exercise?.area||row.exercise?.subject||'Mathématiques',
      attemptCount:row.attemptCount,recentCount:recent.length,successRate:mean==null?null:Math.round(mean*100)/100,
      needsPractice:mean!=null && mean<100,lastDate:row.lastDate,
      lastScore:row.recent[0]?.score??null,lastMaxScore:row.recent[0]?.maxScore??null};
  }).sort((a,b)=>(a.successRate??Infinity)-(b.successRate??Infinity)||new Date(a.lastDate)-new Date(b.lastDate)||a.name.localeCompare(b.name,'fr'));
}
module.exports={validId,percent,encodeCursor,decodeCursor,summarizeExercises};
