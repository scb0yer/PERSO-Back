const express = require("express");
const router = express.Router();
const Eleve = require("../models/Eleve");

// envoyer un email par mailgun
router.post("/addResults", async (req, res) => {
  try {
    const name = req.body.name;
    const names = [
      process.env.ELEVE_1,
      process.env.ELEVE_2,
      process.env.ELEVE_3,
      process.env.ELEVE_4,
      process.env.ELEVE_5,
      process.env.ELEVE_6,
      process.env.ELEVE_7,
      process.env.ELEVE_8,
      process.env.ELEVE_9,
      process.env.ELEVE_10,
      process.env.ELEVE_11,
      process.env.ELEVE_12,
      process.env.ELEVE_13,
      process.env.ELEVE_14,
      process.env.ELEVE_15,
      process.env.ELEVE_16,
      process.env.ELEVE_17,
      process.env.ELEVE_18,
      process.env.ELEVE_19,
      process.env.ELEVE_20,
      process.env.ELEVE_21,
      process.env.ELEVE_22,
      process.env.ELEVE_23,
    ];

    for (let n = 0; n < names.length; n++) {
      if (name === names[n]) {
        const date = new Date();
        const score = req.body.score;
        const eleve = await Eleve.findOne({ name });
        if (eleve) {
          const newScores = [...eleve.scores];
          newScores.push({ date, score });
          const eleveUpdated = await findByIdAndUpdate(
            eleve._id,
            { scores: newScores },
            { new: true }
          );
          await eleveUpdated.save();
          return res.status(200).json(eleveUpdated);
        } else {
          const newEleve = new Eleve({
            name,
            scores: [{ date, score }],
          });
          await newEleve.save();
          return res.status(200).json(newEleve);
        }
      } else {
        return res
          .status(400)
          .json({ message: "Il n'y a aucun élève enregistré sous ce nom." });
      }
    }
  } catch (error) {
    res.status(400).json(error);
  }
  res.status(200).json({ message: "infos bien reçues" });
});

module.exports = router;
