const express = require("express");
const router = express.Router();
const createStripe = require("stripe");
const Order = require("../models/Order");
const Newsletter = require("../models/Newsletter");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const { DateTime } = require("luxon");

const client = mailgun.client({
  username: "Sophie Boyer",
  key: process.env.API_KEY_MAILGUN,
});

const stripe = createStripe(process.env.STRIPE_API_SECRET);

router.post("/ROMAN/promoCheck", async (req, res) => {
  try {
    let response = "";
    if (req.body.amount >= 40 && req.body.promo === process.env.PROMO) {
      response = 0.1;
    } else {
      response = false;
    }
    return res.status(200).json({
      response,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// router.post("/ROMAN/payment", async (req, res) => {
//   console.log(req.body);

//   try {
//     if (
//       !req.body.email ||
//       !req.body.orderRef ||
//       !req.body.amount ||
//       !req.body.stripeToken ||
//       !req.body.details ||
//       !req.body.country
//     ) {
//       res
//         .status(400)
//         .json({ message: "Il manque des informations obligatoires." });
//     }

//     let orderRef = req.body.orderRef;
//     const refAlreadyExist = await Order.findOne({ ref: req.body.orderRef });
//     if (refAlreadyExist) {
//       const orders = await Order.find();
//       let month = new Date().getUTCMonth() + 1;
//       if (month < 10) {
//         month = `0${month}`;
//       }
//       const year = new Date().getUTCFullYear().toString().slice(-2);
//       orderRef = `LDH${year}${month}${orders.length + 1}ST`;
//     }

//     const today = DateTime.now().setZone("Europe/Paris").toISO();
//     const newOrder = new Order({
//       ref: orderRef,
//       date: today,
//       name: req.body.name,
//       email: req.body.email,
//       dedication: req.body.dedication,
//       nameToDedicate: req.body.nameToDedicate,
//       status: "commandée",
//       details: req.body.details,
//       country: req.body.country,
//     });
//     await newOrder.save();

//     let { status } = await stripe.charges.create({
//       amount: (req.body.amount * 100).toFixed(0),
//       currency: "eur",
//       description: `Paiement de votre commande : ${orderRef}`,
//       source: req.body.stripeToken,
//       receipt_email: req.body.email,
//     });

//     if (status === "succeeded") {
//       await Order.findOneAndUpdate(
//         { ref: orderRef },
//         {
//           status: "payée",
//         },
//         { new: true }
//       );
//       const formattedHtml = `

// Commande de ${req.body.name} n°${orderRef} :

// • adresse email : ${req.body.email}
// • Date de la commande : ${today}

// ${req.body.details
//   .map(
//     (product) => `

//           → ${product.title} - Quantité: ${product.quantity}, Prix total: ${product.amount} €
//     `
//   )
//   .join("")}

// ${req.body.dedication && `✍️ Nom à dédicacer : ${req.body.nameToDedicate}`}

// Montant total (avec frais de livraison) : ${req.body.amount} €
// Statut : ✅ Payée
// ✈️ Pays d'envoi : ${req.body.country}

// `;
//       const messageData = {
//         from: `LE DERNIER HÉRITIER <scboyer.writting@gmail.com>`,
//         to: process.env.MY_EMAIL_WRITING,
//         subject: `Nouvelle commande à envoyer`,
//         text: formattedHtml,
//       };
//       const response = await client.messages.create(
//         process.env.DOMAIN_MAILGUN,
//         messageData
//       );
//       const emailIsFound = await Newsletter.findOne({
//         email: req.body.email,
//       });
//       if (!emailIsFound && req.body.newsletter) {
//         const newNewsletter = new Newsletter({
//           name: req.body.name,
//           date: today,
//           email: req.body.email,
//         });
//         await newNewsletter.save();
//       }
//       return res.status(200).json({ status });
//     } else {
//       await Order.findOneAndUpdate(
//         { ref: orderRef },
//         {
//           status: "annulée",
//         },
//         { new: true }
//       );
//       res.status(500).json({ message: error.message });
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

router.post("/ROMAN/payment", async (req, res) => {
  try {
    const {
      name,
      email,
      amount,
      orderRef,
      details,
      dedication,
      nameToDedicate,
      newsletter,
      country,
    } = req.body;
    const today = DateTime.now().setZone("Europe/Paris").toISO();
    if (!email || !orderRef || !amount || !details || !country) {
      return res
        .status(400)
        .json({ message: "Il manque des informations obligatoires." });
    }

    let finalOrderRef = orderRef;
    const refAlreadyExist = await Order.findOne({ ref: orderRef });
    if (refAlreadyExist) {
      const orders = await Order.find();
      let month = new Date().getUTCMonth() + 1;
      if (month < 10) {
        month = `0${month}`;
      }
      const year = new Date().getUTCFullYear().toString().slice(-2);
      finalOrderRef = `LDH${year}${month}${orders.length + 1}ST`;
    }

    const newOrder = new Order({
      ref: finalOrderRef,
      date: today,
      name,
      email,
      dedication,
      nameToDedicate,
      status: "en attente de paiement",
      details,
      country,
    });
    await newOrder.save();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // en centimes
      currency: "eur",
      payment_method_types: ["card"],
      receipt_email: email,
      metadata: {
        orderRef: finalOrderRef,
        name,
        email,
      },
    });
    const formattedHtml = `

    Commande de ${req.body.name} n°${orderRef} :
    
    • adresse email : ${req.body.email}
    • Date de la commande : ${today}
    
    ${req.body.details
      .map(
        (product) => `
          
              → ${product.title} - Quantité: ${product.quantity}, Prix total: ${product.amount} €
        `
      )
      .join("")}
    
    ${req.body.dedication && `✍️ Nom à dédicacer : ${req.body.nameToDedicate}`}
    
    Montant total (avec frais de livraison) : ${req.body.amount} €
    Statut : ⏳ En attente de confirmation
    ✈️ Pays d'envoi : ${req.body.country}
    
    `;

    const messageData = {
      from: `LE DERNIER HÉRITIER <scboyer.writting@gmail.com>`,
      to: process.env.MY_EMAIL_WRITING,
      subject: `Nouvelle commande reçue`,
      text: formattedHtml,
    };
    const response = await client.messages.create(
      process.env.DOMAIN_MAILGUN,
      messageData
    );
    const emailIsFound = await Newsletter.findOne({
      email: req.body.email,
    });
    if (!emailIsFound && req.body.newsletter) {
      const newNewsletter = new Newsletter({
        name: req.body.name,
        date: today,
        email: req.body.email,
      });
      await newNewsletter.save();
    }
    if (newsletter) {
      const emailIsFound = await Newsletter.findOne({ email });
      if (!emailIsFound) {
        const newNewsletter = new Newsletter({ name, date: today, email });
        await newNewsletter.save();
      }
    }
    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erreur Stripe backend:", error.message);
    return res.status(500).json({ message: error.message });
  }
});

router.post("/ROMAN/payment-confirmation", async (req, res) => {
  try {
    const {
      orderRef,
      name,
      email,
      amount,
      details,
      dedication,
      nameToDedicate,
      country,
      newsletter,
    } = req.body;

    if (!orderRef) {
      return res.status(400).json({ message: "Référence commande manquante" });
    }

    const order = await Order.findOneAndUpdate(
      { ref: orderRef },
      { status: "payée" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    const today = DateTime.now().setZone("Europe/Paris").toISO();

    const formattedHtml = `

Commande de ${name} n°${orderRef} :

• adresse email : ${email}
• Date de la commande : ${today}

${details
  .map(
    (product) => `
      
          → ${product.title} - Quantité: ${product.quantity}, Prix total: ${product.amount} €
    `
  )
  .join("")}

${dedication && `✍️ Nom à dédicacer : ${nameToDedicate}`}

Montant total (avec frais de livraison) : ${amount} €
Statut : ✅ Payée
✈️ Pays d'envoi : ${country}

`;

    const messageData = {
      from: `LE DERNIER HÉRITIER <scboyer.writting@gmail.com>`,
      to: process.env.MY_EMAIL_WRITING,
      subject: `Nouvelle commande à envoyer`,
      text: formattedHtml,
    };
    await client.messages.create(process.env.DOMAIN_MAILGUN, messageData);

    return res.status(200).json({ status: "mail envoyé + commande confirmée" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
