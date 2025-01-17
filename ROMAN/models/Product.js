const mongoose = require("mongoose");

const Product = mongoose.model("Product", {
  title: String,
  price: Number,
  description: String,
  img: String,
  status: String,
});
module.exports = Product;
