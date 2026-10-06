const { parisDay } = require("./points-rules");
const HISTORY_WINDOW = 5;

// Fonction pure : les tentatives de chaque activité sont déjà triées par date
// décroissante et limitées aux cinq dernières par la requête MongoDB.
function rankSuggestions(activities, now = new Date()) {
  const day = parisDay(now);
  let completedToday = 0;
  const candidates = [];
  for (const activity of activities) {
    const attempts = activity.attempts.slice(0, HISTORY_WINDOW);
    const lastAttempt = attempts[0];
    // Aucun lien avec les points : une série à 0/5 ou ne rapportant plus
    // de points reste une activité terminée aujourd'hui.
    if (lastAttempt && parisDay(new Date(lastAttempt.date)) === day) {
      completedToday++;
      continue;
    }
    const percentages = attempts
      .filter(a => Number.isFinite(a.score) && Number.isFinite(a.maxScore)
        && a.maxScore > 0 && a.score >= 0 && a.score <= a.maxScore)
      .map(a => a.score / a.maxScore * 100);
    const average = percentages.length
      ? percentages.reduce((sum, score) => sum + score, 0) / percentages.length
      : null;
    candidates.push({
      exerciceId: String(activity.exerciceId),
      name: activity.name,
      activity: activity.activity,
      mode: activity.mode,
      reason: !lastAttempt ? "discover" : average !== null && average < 100 ? "practice" : "review",
      neverAttempted: !lastAttempt,
      lastAttemptAt: lastAttempt ? new Date(lastAttempt.date).toISOString() : null,
      recentAveragePercentage: average,
      recentAttemptCount: percentages.length,
    });
  }
  candidates.sort((a, b) => {
    if (a.neverAttempted !== b.neverAttempted) return a.neverAttempted ? -1 : 1;
    if (!a.neverAttempted) {
      // Les anciennes tentatives sans score exploitable sont à revoir.
      const scoreDifference = (a.recentAveragePercentage ?? 0) - (b.recentAveragePercentage ?? 0);
      if (Math.abs(scoreDifference) > 1e-9) return scoreDifference;
      const dateDifference = new Date(a.lastAttemptAt) - new Date(b.lastAttemptAt);
      if (dateDifference) return dateDifference;
    }
    // Égalité parfaite : ordre déterministe, pas de tirage au sort quotidien.
    return a.exerciceId < b.exerciceId ? -1 : a.exerciceId > b.exerciceId ? 1 : 0;
  });
  return {
    day,
    timeZone: "Europe/Paris",
    historyWindow: HISTORY_WINDOW,
    totalActivities: activities.length,
    completedToday,
    remainingToday: candidates.length,
    items: candidates.slice(0, 2).map(item => ({
      ...item,
      recentAveragePercentage: item.recentAveragePercentage === null
        ? null : Math.round(item.recentAveragePercentage * 100) / 100,
    })),
  };
}

module.exports = { HISTORY_WINDOW, rankSuggestions };
