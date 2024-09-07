const mongoose = require("mongoose");

const Statistic = mongoose.model("Statistic", {
  name: String,
  // MoisAAAA
  status: String,
  // encours, archivé
  home_ip: Array,
  home_total: Number,
  jeu_ip: Array,
  jeu_total: Number,
  nbPartie: Number,
  univers_ip: Array,
  univers_total: Number,
});
module.exports = Statistic;
