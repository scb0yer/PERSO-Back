const Attempt = require("../models/Attempt");
const Exercice = require("../models/Exercice");
const catalog = require("./activity-catalog");
const { HISTORY_WINDOW, rankSuggestions } = require("./suggestion-rules");

module.exports = async function suggestions(studentId, now = new Date()) {
  const exercises = await Exercice.find({
    _id: { $in: catalog.map(item => item.exerciceId) },
  }).select("name").lean();
  const published = new Map(exercises.map(exercise => [String(exercise._id), exercise]));
  // Une activité absente de MongoDB n'est pas proposée.
  const available = catalog.filter(item => published.has(item.exerciceId));
  const activities = await Promise.all(available.map(async item => ({
    ...item,
    name: published.get(item.exerciceId).name,
    attempts: await Attempt.find({
      studentId,
      exerciceId: item.exerciceId,
      date: { $lte: now },
    }).select("score maxScore date")
      .sort({ date: -1, _id: -1 }).limit(HISTORY_WINDOW).lean(),
  })));
  return rankSuggestions(activities, now);
};
