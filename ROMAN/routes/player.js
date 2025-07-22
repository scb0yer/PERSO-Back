const express = require("express");
const Player = require("../models/Player");
const Newsletter = require("../models/Newsletter");
const router = express.Router();
const { DateTime } = require("luxon");

router.get("/ROMAN/checkedPlayers", async (req, res) => {
  try {
    const players = await Player.find({ status: "validé" }).sort({ result: 1 });
    return res.status(200).json({
      players,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/ROMAN/newPlayer", async (req, res) => {
  try {
    const { name, email, amazon, resultsDetails } = req.body;
    const today = DateTime.now().setZone("Europe/Paris").toISO();
    if (!email || !name || !amazon || !resultsDetails) {
      return res
        .status(400)
        .json({ message: "Il manque des informations obligatoires." });
    }
    const playerIsFound = await Player.findOne({
      email,
    });
    if (playerIsFound) {
      return res
        .status(400)
        .json({ message: "Vous avez déjà participé à ce concours." });
    }
    const emailIsFound = await Newsletter.findOne({
      email,
    });
    if (!emailIsFound) {
      return res.status(400).json({
        message:
          "Ce concours est réservé aux personnes inscrites à la newsletter.",
      });
    }
    // calcul du résultat pour le concours "Pour l'Empereur !"
    let result = 0;
    if (resultsDetails.q1 === 2) {
      result += 0.5;
    }
    const q2 = [1, 1, 0, 0, 1, 0];
    for (let r = 0; r < resultsDetails.q2.length; r++) {
      if (resultsDetails.q2[r] === q2[r]) {
        result += 0.25;
      }
    }
    if (resultsDetails.q3 === 0) {
      result += 0.5;
    }
    const q4 = [0, 1, 1, 0, 1, 0];
    for (let r = 0; r < resultsDetails.q4.length; r++) {
      if (resultsDetails.q4[r] === q4[r]) {
        result += 0.25;
      }
    }
    if (resultsDetails.q5 === 1) {
      result += 1;
    }

    const newPlayer = new Player({
      date: today,
      name,
      email,
      amazon,
      resultsDetails,
      result,
      status: "en attente de validation",
      contest: "Pour l'Empereur !",
    });
    await newPlayer.save();

    return res.status(200).json({
      message: `Votre participation a bien été prise en compte ! Votre score est de ${result} sur 5.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
module.exports = router;
