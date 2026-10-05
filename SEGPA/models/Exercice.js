const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Exercice",
  new mongoose.Schema({
    subject: String,
    area: String,
    name: { type: String, required: true },
    difficulty: Number,
  }),
);
