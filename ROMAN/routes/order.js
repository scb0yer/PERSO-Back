const express = require("express");
const Order = require("../models/Order");
const router = express.Router();

router.get("/ROMAN/orderRef", async (req, res) => {
  try {
    const orders = await Order.find();
    let month = new Date().getUTCMonth() + 1;
    if (month < 10) {
      month = `0${month}`;
    }
    const year = new Date().getUTCFullYear().toString().slice(-2);
    const orderRef = `LDH${year}${month}${orders.length + 1}ST`;
    return res.status(200).json({
      orderRef,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
