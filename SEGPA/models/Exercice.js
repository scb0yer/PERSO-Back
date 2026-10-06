const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Exercice",
  new mongoose.Schema({
    subject: String,
    area: String,
    name: { type: String, required: true },
    difficulty: Number,
    // Les exercices existants conservent le barème habituel.
    rewardPolicy: {
      type: String,
      enum: ["standard5", "completion3"],
      default: "standard5",
    },
  }),
);
