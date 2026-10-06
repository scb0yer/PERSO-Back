const DAY_CAP = 10;
function parisDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
// La règle provient du document Exercice lu côté serveur, jamais du frontend.
function awardedTenths(score, maxScore, alreadyEarned, rewardPolicy = 'standard5') {
  const fail = message => Object.assign(new Error(message), { status: 400 });
  if (!['standard5', 'completion3'].includes(rewardPolicy))
    throw fail('Barème de cet exercice non reconnu.');
  const expected = rewardPolicy === 'completion3' ? 3 : 5;
  if (!Number.isInteger(score) || maxScore !== expected || score < 0 || score > expected)
    throw fail(`Cet exercice attend une série de ${expected} recherches et un score entier de 0 à ${expected}.`);
  const gain = rewardPolicy === 'completion3' ? 10 : 5 + score;
  return Math.min(gain, Math.max(0, DAY_CAP - alreadyEarned));
}
module.exports = { DAY_CAP, parisDay, awardedTenths };
