const mongoose = require("mongoose");

const Eleve = mongoose.model("Eleve", {
  name: String,
  scores: [
    {
      date: Date,
      score: Array,
    },
  ],
});
module.exports = Eleve;
