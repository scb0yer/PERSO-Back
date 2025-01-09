const express = require("express");
const router = express.Router();
const createStripe = require("stripe");
const Order = require("../models/Order");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

const client = mailgun.client({
  username: "Sophie Boyer",
  key: process.env.API_KEY_MAILGUN,
});

const stripe = createStripe(process.env.STRIPE_API_SECRET);

router.post("/ROMAN/payment", async (req, res) => {
  console.log(req.body);
  if (
    req.body.email &&
    req.body.orderRef &&
    req.body.amount &&
    req.body.stripeToken
  )
    try {
      let orderRef = req.body.orderRef;
      const refAlreadyExist = await Order.findOne({ ref: req.body.orderRef });
      if (refAlreadyExist) {
        const orders = await Order.find();
        let month = new Date().getUTCMonth() + 1;
        if (month < 10) {
          month = `0${month}`;
        }
        const year = new Date().getUTCFullYear().toString().slice(-2);
        orderRef = `LDH${year}${month}${orders.length + 1}ST`;
      }

      const today = new Date().toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const newOrder = new Order({
        ref: orderRef,
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
      if (status === "succeeded") {
        await Order.findOneAndUpdate(
          { ref: req.body.orderRef },
          {
            status: "payée",
          },
          { new: true }
        );
        const formattedHtml = `
  <h2>Commande de ${req.body.name} n°${orderRef} :</h2>
  <div>adresse email : ${req.body.email}</div>
  <div>Date de la commande : ${today}</div>
  <ul>
    ${productsToBuy
      .map(
        (product) => `
      <li><strong>${product.title}</strong> - Quantité: ${product.quantity}, Prix total: ${product.amount} €</li>
    `
      )
      .join("")}
  </ul>
  ${req.body.dedication && `<div>Nom à dédicacer : ${nameToDedicate}</div>`}
  <div>Montant total (avec frais de livraison) : ${req.body.amount} €</div>
  <div>Statut : Payée</div>
`;
        const messageData = {
          from: `LE DERNIER HÉRITIER`,
          to: process.env.MY_EMAIL_WRITING,
          subject: `Nouvelle commande à envoyer`,
          text: formattedHtml,
        };
        const response = await client.messages.create(
          process.env.DOMAIN_MAILGUN,
          messageData
        );
        return res.status(200).json({ status });
      } else {
        await Order.findOneAndUpdate(
          { ref: req.body.orderRef },
          {
            status: "annulée",
          },
          { new: true }
        );
        res.status(500).json({ message: error.message });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
});

module.exports = router;
