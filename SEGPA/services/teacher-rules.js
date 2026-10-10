const {monday, addDays, result} = require('./week-rules');
const mean = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
const round = n => n == null ? null : Math.round(n*100)/100;
function validWeek(week) {
  if(typeof week !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(week)) return false;
  const date = new Date(week+'T12:00:00Z');
  return Number.isFinite(+date) && date.toISOString().slice(0,10)===week && monday(week)===week;
}
function historyFor(student, settings, current) {
  const previous = student.weeklyResults || {};
  const start = [current, ...Object.keys(previous), ...settings.periods.map(p=>p.startWeek)].sort()[0];
  const rows=[];
  for(let week=start; week<=current; week=addDays(week,7)) {
    const row=previous[week] || result(week,0,200,true);
    const classExcluded=settings.exclusions.some(e=>e.studentId==='*' && e.week===week);
    const individualExcluded=settings.exclusions.some(e=>e.studentId===String(student._id) && e.week===week);
    rows.push({...row, provisional:week===current, classExcluded, individualExcluded, excluded:classExcluded||individualExcluded});
  }
  return rows.reverse();
}
function periodAverages(history, periods, current) {
  return periods.map((p,i)=>{
    const endWeek=periods[i+1]?.startWeek || null;
    const eligible=history.filter(r=>r.week>=p.startWeek && (!endWeek || r.week<endWeek) && r.week<current && !r.excluded);
    return {id:String(p._id), name:p.name, startWeek:p.startWeek, endWeek, count:eligible.length, average:round(mean(eligible.map(r=>r.gradeOn20)))};
  });
}
// rows : une ligne par élève et exercice, avec count et success (ratio moyen 0..1).
function exerciseStats(exercises, rows, studentCount) {
  const stats=exercises.map(ex=>{
    const own=rows.filter(r=>String(r._id.exercise)===String(ex._id));
    const attempts=own.reduce((sum,r)=>sum+r.count,0);
    return {id:String(ex._id),name:ex.name,area:ex.area||ex.subject||'Mathématiques',participants:own.length,attempts,
      attemptsPerStudent:studentCount ? attempts/studentCount : 0,
      successRate:mean(own.filter(r=>r.success!=null).map(r=>r.success*100))};
  });
  const attemptsBenchmark=mean(stats.map(s=>s.attemptsPerStudent));
  const successBenchmark=mean(stats.filter(s=>s.successRate!=null).map(s=>s.successRate));
  return {attemptsBenchmark:round(attemptsBenchmark),successBenchmark:round(successBenchmark),rows:stats.map(s=>({...s,
    lowAttempts:s.attemptsPerStudent<attemptsBenchmark,
    lowSuccess:s.successRate!=null && successBenchmark!=null && s.successRate<successBenchmark,
    attemptsPerStudent:round(s.attemptsPerStudent),successRate:round(s.successRate)}))};
}
module.exports={validWeek,historyFor,periodAverages,exerciseStats};
