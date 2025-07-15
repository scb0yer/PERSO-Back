const express = require("express");
const router = express.Router();
const Statistic = require("../models/Statistic");
const Newsletter = require("../models/Newsletter");
const Order = require("../models/Order");

// vérifier si l'IP existe, sinon l'enregistrer et ajouter la visite.
router.post("/ROMAN/ip", async (req, res) => {
  try {
    let ipAlreadyExists = false;
    const adresses = await Statistic.findOne({ status: "encours" });
    if (req.body.page === "home") {
      let home_ip = [];
      let home_total = 0;
      if (adresses.home_total) {
        home_ip = adresses.home_ip;
        home_total = adresses.home_total;
        ipAlreadyExists = adresses.home_ip.includes(req.body.ip);
      }
      if (!ipAlreadyExists) {
        home_ip.push(req.body.ip);
        home_total++;
      }
      await Statistic.findByIdAndUpdate(
        adresses._id,
        {
          home_ip,
          home_total,
        },
        { new: true }
      );
    } else if (req.body.page === "jeu") {
      let jeu_ip = [];
      let jeu_total = 0;
      if (adresses.jeu_total) {
        jeu_ip = adresses.jeu_ip;
        jeu_total = adresses.jeu_total;
        ipAlreadyExists = adresses.jeu_ip.includes(req.body.ip);
      }
      if (!ipAlreadyExists) {
        jeu_ip.push(req.body.ip);
        jeu_total++;
      }
      await Statistic.findByIdAndUpdate(
        adresses._id,
        {
          jeu_ip,
          jeu_total,
        },
        { new: true }
      );
    } else if (req.body.page === "univers") {
      let univers_ip = [];
      let univers_total = 0;
      if (adresses.univers_total) {
        univers_ip = adresses.univers_ip;
        univers_total = adresses.univers_total;
        ipAlreadyExists = adresses.univers_ip.includes(req.body.ip);
      }
      if (!ipAlreadyExists) {
        univers_ip.push(req.body.ip);
        univers_total++;
      }
      await Statistic.findByIdAndUpdate(
        adresses._id,
        {
          univers_ip,
          univers_total,
        },
        { new: true }
      );
    } else if (req.body.page === "boutique") {
      let boutique_ip = [];
      let boutique_total = 0;
      if (adresses.boutique_total) {
        boutique_ip = adresses.boutique_ip;
        boutique_total = adresses.boutique_total;
        ipAlreadyExists = adresses.boutique_ip.includes(req.body.ip);
      }
      if (!ipAlreadyExists) {
        boutique_ip.push(req.body.ip);
        boutique_total++;
      }
      await Statistic.findByIdAndUpdate(
        boutique_ip._id,
        {
          boutique_ip,
          boutique_total,
        },
        { new: true }
      );
    }

    return res.status(200).json({ message: "Les statistiques sont à jour" });
  } catch (error) {
    return res.status(400).json(error.message);
  }
});

// Enregistrer l'username quand une partie est jouée
router.post("/ROMAN/partie", async (req, res) => {
  try {
    if (req.body.username) {
      const today = new Date().toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const statistiques = await Statistic.findOne({ status: "encours" });
      const parties = statistiques.parties;
      parties.push({
        pseudo: req.body.username,
        date: today,
        support: req.body.support,
      });
      await Statistic.findByIdAndUpdate(
        statistiques._id,
        {
          parties,
        },
        { new: true }
      );
      return res
        .status(200)
        .json({ message: "Une nouvelle partie a été lancée." });
    } else {
      return res.status(500).json({ message: "Les statistiques sont à jour." });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
});

// archiver les statistiques à la fin du mois
router.post("/ROMAN/archive", async (req, res) => {
  try {
    if (
      req.body.name &&
      req.body.token &&
      req.body.token === process.env.TOKEN
    ) {
      const encours = await Statistic.findOne({ status: "encours" });
      let orderRef = `LDH${encours.name.slice(-2)}`;
      if (encours.name.slice(0, 4) === "Janv") {
        orderRef += "01";
      }
      if (encours.name.slice(0, 1) === "F") {
        orderRef += "02";
      }
      if (encours.name.slice(0, 3) === "Mar") {
        orderRef += "03";
      }
      if (encours.name.slice(0, 2) === "Av") {
        orderRef += "04";
      }
      if (encours.name.slice(0, 3) === "Mai") {
        orderRef += "05";
      }
      if (encours.name.slice(0, 4) === "Juin") {
        orderRef += "06";
      }
      if (encours.name.slice(0, 4) === "Juil") {
        orderRef += "07";
      }
      if (encours.name.slice(0, 2) === "Ao") {
        orderRef += "08";
      }
      if (encours.name.slice(0, 1) === "S") {
        orderRef += "09";
      }
      if (encours.name.slice(0, 1) === "O") {
        orderRef += "10";
      }
      if (encours.name.slice(0, 1) === "N") {
        orderRef += "11";
      }
      if (encours.name.slice(0, 1) === "D") {
        orderRef += "12";
      }
      const orders = await Order.find({
        ref: { $regex: /^${orderRef}/ },
      });

      let totalCA = 0;
      orders.forEach((order) => {
        order.details.forEach((item) => {
          const quantity = item.quantity;
          const price = parseFloat(item.price); // au cas où le prix est une string
          totalCA += quantity * price;
        });
      });

      const adresses = await Statistic.findOneAndUpdate(
        { status: "encours" },
        { status: "archivé", orders: orders.length, CA: totalCA },
        { new: true }
      );
      const newStatistic = new Statistic({
        name: req.body.name,
        status: "encours",
      });
      await newStatistic.save();
      return res
        .status(200)
        .json({ message: "Le mois précédent a bien été archivé" });
    } else {
      return res.status(500).json({ message: "Les statistiques sont à jour" });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
});

router.post("/ROMAN/loginAdmin", async (req, res) => {
  try {
    if (
      req.body.username === process.env.USERNAME &&
      req.body.password === process.env.MDP_ADMIN
    ) {
      const encours = await Statistic.findOne({ status: "encours" });
      let orderRef = `LDH${encours.name.slice(-2)}`;
      if (encours.name.slice(0, 4) === "Janv") {
        orderRef += "01";
      }
      if (encours.name.slice(0, 1) === "F") {
        orderRef += "02";
      }
      if (encours.name.slice(0, 3) === "Mar") {
        orderRef += "03";
      }
      if (encours.name.slice(0, 2) === "Av") {
        orderRef += "04";
      }
      if (encours.name.slice(0, 3) === "Mai") {
        orderRef += "05";
      }
      if (encours.name.slice(0, 4) === "Juin") {
        orderRef += "06";
      }
      if (encours.name.slice(0, 4) === "Juil") {
        orderRef += "07";
      }
      if (encours.name.slice(0, 2) === "Ao") {
        orderRef += "08";
      }
      if (encours.name.slice(0, 1) === "S") {
        orderRef += "09";
      }
      if (encours.name.slice(0, 1) === "O") {
        orderRef += "10";
      }
      if (encours.name.slice(0, 1) === "N") {
        orderRef += "11";
      }
      if (encours.name.slice(0, 1) === "D") {
        orderRef += "12";
      }
      const orders = await Order.find({
        ref: { $regex: /^${orderRef}/ },
      });
      let CA = 0;
      orders.forEach((order) => {
        order.details.forEach((item) => {
          const quantity = item.quantity;
          const price = parseFloat(item.price); // au cas où le prix est une string
          CA += quantity * price;
        });
      });
      const statistics = await Statistic.find();
      const newsletter = await Newsletter.find();
      return res.status(200).json({
        statistics,
        token: process.env.TOKEN,
        newsletter: newsletter.length,
        orders,
        CA,
      });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
