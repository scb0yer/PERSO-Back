const express = require("express");
const router = express.Router();
const createStripe = require("stripe");
const Order = require("../models/Order");

const stripe = createStripe(process.env.STRIPE_API_SECRET);

router.post("/payment", async (req, res) => {
  console.log(req.body);
  if (
    req.body.payed &&
    req.body.email &&
    req.body.orderRef &&
    req.body.amount &&
    req.body.stripeToken
  )
    try {
      const newOrder = new Order({
        ref: req.body.orderRef,
        date: today,
        name: req.body.name,
        email: req.body.email,
        dedication: req.body.dedication,
        nameToDedicate: req.body.nameToDedicate,
        status: "commandée",
        details: req.body.details,
      });
      await newOrder.save();
      let { status } = await stripe.charges.create({
        amount: (req.body.amount * 100).toFixed(0),
        currency: "eur",
        description: `Paiement de votre commande : ${req.body.orderRef}`,
        source: req.body.stripeToken,
      });
      const today = new Date().toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      await Order.findOneAndUpdate(
        { orderRef: req.body.orderRef },
        {
          status: "payée",
        },
        { new: true }
      );
      return res.status(200).json({
        message:
          "Votre commande a bien été enregistrée. Vous recevrez bientôt un email de Mondial Relay pour choisir votre point relais.",
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
});

module.exports = router;
