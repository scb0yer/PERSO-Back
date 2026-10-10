const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  exerciceId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercice", required: true },
  // Classe au moment de la tentative : l'historique ne change pas si l'élève change de classe.
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Classe", required: true },
  score: { type: Number, required: true, min: 0 },
  maxScore: { type: Number, required: true, min: 1 },
  scoreVerified: { type: Boolean, default: false },
  submissionId: { type: String, required: true },
  pointsAwardedTenths: { type: Number, default: 0, min: 0, max: 10, validate: Number.isInteger },
  // Jour civil à Paris, calculé par le serveur. Pas de valeur par défaut pour les anciennes tentatives.
  rewardDay: String,
  rewardTheme: String,
  themeDayTenthsAfter: { type: Number, min: 0 },
  exerciseDayTenthsAfter: { type: Number, min: 0, max: 10 },
  pointsRuleVersion: Number,
  weeklyContribution: { type: mongoose.Schema.Types.Mixed },
  date: { type: Date, default: Date.now },
});
schema.index({ studentId: 1, date: -1 });
schema.index({ classId: 1 });
schema.index({ classId: 1, rewardDay: 1 });
schema.index({ studentId: 1, exerciceId: 1, rewardDay: 1 });
schema.index({ studentId: 1, rewardDay: 1 });
schema.index({ studentId: 1, rewardTheme: 1, rewardDay: 1 });
schema.index({ studentId: 1, submissionId: 1 }, { unique: true });
module.exports = mongoose.model("Attempt", schema);
