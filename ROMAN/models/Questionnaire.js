const mongoose = require("mongoose");

const Questionnaire = mongoose.model("Questionnaire", {
  date: Date,
  result: String,
});
module.exports = Questionnaire;
