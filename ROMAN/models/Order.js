const mongoose = require("mongoose");

const Order = mongoose.model("Order", {
  ref: String,
  date: Date,
  name: String,
  dedication: Boolean,
  nameToDedicate: String,
  status: String,
  // payée - en attente confirmation point relais - envoyée
  tracking: String,
  email: String,
  country: String,
  details: [{ product: String, quantity: Number, price: String }],
  support: String,
});
module.exports = Order;
