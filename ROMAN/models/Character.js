const mongoose = require("mongoose");

const Character = mongoose.model("Character", {
  name: String,
  img: String,
  description: String,
  age: Number,
  gift: String,
  gemme: String,
  race: String,
  siblings: Array,
  chapters: Array,
});
module.exports = Character;
