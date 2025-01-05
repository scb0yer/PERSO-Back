const mongoose = require("mongoose");

const Newsletter = mongoose.model("Newsletter", {
  name: String,
  date: Date,
  email: String,
});
module.exports = Newsletter;
