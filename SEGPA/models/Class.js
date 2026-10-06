const mongoose = require("mongoose");
const weeklyResultSchema = require("./WeeklyResult");
const schema = new mongoose.Schema({
  weeklyResults: { type: Map, of: weeklyResultSchema, default: () => ({}) },
  pointsRevision: { type: Number, default: 0, select: false },
  name: { type: String, required: true },
  // Nombre de tentatives enregistrées, toutes dates confondues.
  target: { type: Number, min: 0, default: 0 },
});
module.exports = mongoose.model("Classe", schema);
