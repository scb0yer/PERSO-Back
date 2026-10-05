const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  exerciceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exercice",
    required: true,
  },
  // Classe au moment de la tentative : l'historique ne change pas si l'élève change de classe.
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classe",
    required: true,
  },
  score: { type: Number, required: true, min: 0 },
  maxScore: { type: Number, required: true, min: 1 },
  scoreVerified: { type: Boolean, default: false },
  submissionId: { type: String, required: true },
  date: { type: Date, default: Date.now },
});
schema.index({ studentId: 1, date: -1 });
schema.index({ classId: 1 });
schema.index({ studentId: 1, submissionId: 1 }, { unique: true });
module.exports = mongoose.model("Attempt", schema);
