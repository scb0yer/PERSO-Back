const DAY_CAP = 10;
function parisDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function awardedTenths(score, maxScore, alreadyEarned) {
  if (!Number.isInteger(score) || maxScore !== 5 || score < 0 || score > 5)
    throw Object.assign(new Error('Le barème actuel attend une série de 5 questions et un score entier de 0 à 5.'), { status: 400 });
  return Math.min(5 + score, Math.max(0, DAY_CAP - alreadyEarned));
}
module.exports = { DAY_CAP, parisDay, awardedTenths };
