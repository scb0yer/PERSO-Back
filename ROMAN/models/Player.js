const mongoose = require("mongoose");

const Player = mongoose.model("Player", {
  name: String,
  email: String,
  amazon: String,
  resultsDetails: Object,
  result: Number,
  contest: String,
  date: Date,
  status: String,
  favouriteCharacter: String,
  hatedCharacter: String,
});
module.exports = Player;
