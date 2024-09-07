const express = require("express");
const router = express.Router();
const Statistic = require("../models/Statistic");

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
    }

    return res.status(200).json({ message: "Les statistiques sont à jour" });
  } catch (error) {
    return res.status(400).json(error.message);
  }
});

// archiver les statistiques à la fin du mois
router.post("/ROMAN/archive", async (req, res) => {
  try {
    if (req.body.name) {
      const adresses = await Statistic.findOneAndUpdate(
        { status: "encours" },
        { status: "archivé" },
        { new: true }
      );
      const newStatistic = new Statistic({
        name: req.body.name,
        status: "encours",
      });
      await newStatistic.save();
      return res.status(200).json(response);
    } else {
      return res.status(500).json({ message: "Les statistiques sont à jour" });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
});

module.exports = router;
