const mongoose = require("mongoose");
const weeklyResultSchema = require("./WeeklyResult");
const schema = new mongoose.Schema({
  weeklyResults: { type: Map, of: weeklyResultSchema, default: () => ({}) },
  name: { type: String, required: true, trim: true, unique: true },
  // Contient uniquement un hash bcrypt, jamais un mot de passe en clair.
  password: { type: String, required: true, select: false },
  classe: { type: mongoose.Schema.Types.ObjectId, ref: "Classe", required: true },
  // Total cumulé en dixièmes : 17 = 1,7 point. Le backend seul le modifie.
  pointsTenths: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
  // Compteur interne pour sérialiser les transactions de crédit concurrentes.
  pointsRevision: { type: Number, default: 0, select: false },
  avatar: { type: String, default: "" },
});
module.exports = mongoose.model("Student", schema);
