const express = require("express");
const router = express.Router();
const Statistic = require("../models/Statistic");

// vérifier si l'IP existe, sinon l'enregistrer et ajouter la visite.
router.post("/ROMAN/ip", async (req, res) => {
  try {
    const adresses = await Statistic.findOne({ status: "encours" });
    if (req.body.page === "home") {
      let count = 0;
      for (let a = 0; a < adresses.home_ip.length; a++) {
        if (adresses.home_ip[a] === req.body.ip) {
          count++;
        }
      }
      if (count === 0) {
        adresses.home_ip.push(req.body.ip);
        adresses.home_total++;
        const newAdress = await Statistic.findByIdAndUpdate(
          adresses._id,
          adresses,
          { new: true }
        );
      }
    }
    return res.status(200).json(response);
  } catch (error) {
    return res.status(400).json(error);
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
      return res
        .status(500)
        .json({ message: "Il faut indiquer le nom de la session" });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
});

module.exports = router;
