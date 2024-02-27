const express = require("express");
const router = express.Router();
const Eleve = require("../models/Eleve");

// récupérer les résultats des élèves
router.get("/MATHS/getResults", async (req, res) => {
  try {
    if (req.body.mdp === process.env.MDP_ADMIN) {
      const response = [];
      const eleves = await Eleve.find();
      for (let e = 0; e < eleves.length; e++) {
        for (let s = 0; s < eleves[e].scores.length; s++) {
          let rightAnswers = 0;
          let wrongAnswers = 0;
          for (let ss = 0; ss < eleves[e].scores[s].score.length; ss++) {
            rightAnswers += eleves[e].scores[s].score[ss];
            if (eleves[e].scores[s].score[ss] === 0) {
              wrongAnswers++;
            }
          }
          response.push({
            name: eleves[e].name,
            date: eleves[e].scores[s].date,
            rightAnswers,
            wrongAnswers,
          });
        }
      }
      return res.status(200).json(response);
    } else {
      return res.status(400).json({ message: "Accès non autorisé." });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
});

// mettre à jour ses résultats
router.post("/MATHS/addResults", async (req, res) => {
  try {
    if (!req.body.score || req.body.score.length < 5) {
      return res.status(400).json({
        message:
          "Tu dois faire au moins 5 calculs avant d'enregistrer ton résultat.",
      });
    }
    if (req.body.password === process.env.MDP_DEFI) {
      const name = req.body.name;
      console.log(process.env.ELEVE_1);
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
        console.log(names[n]);
        if (name === names[n]) {
          const date = new Date();
          const score = req.body.score;
          const eleve = await Eleve.findOne({ name: name });
          console.log(eleve);
          if (eleve) {
            console.log("OK");
            const newScores = [...eleve.scores];
            console.log(newScores);
            newScores.push({ date, score });
            console.log(newScores);
            const elevetoUpdate = await Eleve.findByIdAndUpdate(
              eleve._id,
              { scores: newScores },
              { new: true }
            );
            console.log(elevetoUpdate);
            await elevetoUpdate.save();
            return res.status(200).json(elevetoUpdate);
          } else {
            const newEleve = new Eleve({
              name,
              scores: [{ date, score }],
            });
            await newEleve.save();
            return res.status(200).json(newEleve);
          }
        }
      }
      return res
        .status(400)
        .json({ message: "Il n'y a aucun élève enregistré sous ce nom." });
    } else {
      return res.status(400).json({ message: "Mot de passe incorrect." });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
});

module.exports = router;
