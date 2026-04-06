const express = require("express");
const Questionnaire = require("../models/Questionnaire");
const router = express.Router();
const { DateTime } = require("luxon");

router.post("/ROMAN/newQuizz", async (req, res) => {
  try {
    const { resultsDetails } = req.body;
    const today = DateTime.now().setZone("Europe/Paris").toISO();
    if (!resultsDetails) {
      return res
        .status(400)
        .json({ message: "Il manque des informations obligatoires." });
    }

    const characters = ["Tashi", "Taegnor", "Chig Rohir", "Jurgen", "Athán"];

    let result = [];
    if (resultsDetails.length > 2) {
      resultsDetails.push("Aucun");
    } else {
      for (let r = 0; r < resultsDetails.length; r++) {
        result.push(characters[resultsDetails[r]]);
      }
    }

    const newPlayer = new Questionnaire({
      date: today,
      result,
    });
    await newPlayer.save();

    let message = `Les personnages auxquels tu ressembles le plus sont ${result}.`;
    return res.status(200).json({
      message,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/ROMAN/quizzResults", async (req, res) => {
  try {
    const results = await Questionnaire.find().select("result");
    const stats = [
      { name: "Tashi", result: 0 },
      { name: "Taegnor", result: 0 },
      { name: "Chig Rohir", result: 0 },
      { name: "Jurgen", result: 0 },
      { name: "Athán", result: 0 },
    ];
    const characters = ["Tashi", "Taegnor", "Chig Rohir", "Jurgen", "Athán"];
    for (let r = 0; r < results.length; r++) {
      results[r].result.forEach((name) => {
        const index = characters.indexOf(name);
        if (index !== -1) {
          stats[index].result++;
        }
      });
    }
    return res.status(200).json({
      stats,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
module.exports = router;
