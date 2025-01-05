const express = require("express");
const Order = require("../models/Order");
const router = express.Router();

// Enregistrer l'username quand une partie est jouée
router.post("/ROMAN/order", async (req, res) => {
  try {
    if (req.body.payed && req.body.email && req.body.details) {
      const today = new Date().toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const orders = await Order.find();
      const newOrder = new Order({
        ref: `STRIPE${orders.length + 1}`,
        date: today,
        name: req.body.name,
        email: req.body.email,
        dedication: req.body.dedication,
        nameToDedicate: req.body.nameToDedicate,
        status: "payée",
        details: req.body.details,
      });
      await newOrder.save();
      return res.status(200).json({
        message:
          "Votre commande a bien été enregistrée. Vous recevrez bientôt un email de Mondial Relay pour choisir votre point relais.",
      });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
