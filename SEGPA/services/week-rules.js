const { parisDay } = require('./points-rules');
const DAY = 86400000;
function monday(day) {
 const date = new Date(day + 'T12:00:00Z');
 date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
 return date.toISOString().slice(0,10);
}
function addDays(day,n) { return new Date(new Date(day+'T12:00:00Z').getTime()+n*DAY).toISOString().slice(0,10); }
function currentWeek(now = new Date()) { return monday(parisDay(now)); }
function result(week, pointsTenths, targetTenths, personal) {
 const rawPercentage = Math.round(pointsTenths / targetTenths * 10000) / 100;
 return { week, endDay: addDays(week,6), pointsTenths, targetTenths,
   percentage: Math.min(100,rawPercentage), rawPercentage,
   gradeOn20: personal ? Math.min(20,Math.round(pointsTenths/targetTenths*200)/10) : null };
}
// Recalcul depuis les gains réellement accordés ; garde les objectifs déjà archivés.
function buildHistory(dayTotals, previous = {}, now = new Date(), personal = true) {
 const current = currentWeek(now);
 const grouped = {};
 for(const row of dayTotals) {
   const week=monday(row._id);
   if(week<=current) grouped[week]=(grouped[week]||0)+row.pointsTenths;
 }
 const keys=[current,...Object.keys(grouped),...Object.keys(previous)].filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&k<=current).sort();
 const history={};
 for(let week=keys[0];week<=current;week=addDays(week,7)) {
   const target=previous[week]?.targetTenths || (personal ? 200 : 2800);
   history[week]=result(week,grouped[week]||0,target,personal);
 }
 return history;
}
module.exports={monday,addDays,currentWeek,result,buildHistory};
