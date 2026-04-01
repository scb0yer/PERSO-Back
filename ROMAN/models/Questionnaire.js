const mongoose = require("mongoose");

const Questionnaire = mongoose.model("Questionnaire", {
  date: Date,
  result: Array,
});
module.exports = Questionnaire;
