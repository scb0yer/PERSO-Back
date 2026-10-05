const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true },
  // Nombre de tentatives enregistrées, toutes dates confondues.
  target: { type: Number, min: 0, default: 0 },
});
module.exports = mongoose.model("Classe", schema);
