// Le champ activity du catalogue définit le thème commun aux différents niveaux.
const catalog=require('./activity-catalog');
function themeFor(exerciseId) {
 const id=String(exerciseId);
 return catalog.find(item=>item.exerciceId===id)?.activity || `exercise:${id}`;
}
function idsForTheme(exerciseId) {
 const theme=themeFor(exerciseId);
 const ids=catalog.filter(item=>item.activity===theme).map(item=>item.exerciceId);
 return ids.length?ids:[String(exerciseId)];
}
function themeTotals(rows) {
 const totals=new Map();
 for(const row of rows){const theme=themeFor(row._id);totals.set(theme,(totals.get(theme)||0)+(row.pointsTenths||0));}
 return totals;
}
module.exports={themeFor,idsForTheme,themeTotals};
