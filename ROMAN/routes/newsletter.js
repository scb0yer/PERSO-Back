const express = require("express");
const Newsletter = require("../models/Newsletter");
const router = express.Router();

// Enregistrer l'username quand une partie est jouée
router.post("/ROMAN/newsletter", async (req, res) => {
  try {
    if (req.body.email) {
      const today = DateTime.now().setZone("Europe/Paris").toISO();
      const emailIsFound = await Newsletter.findOne({ email: req.body.email });
      if (emailIsFound) {
        return res.status(500).json({
          message:
            "Cette adresse email est déjà inscrite pour recevoir les actualités de la saga.",
        });
      } else {
        const newNewsletter = new Newsletter({
          name: req.body.name,
          date: today,
          email: req.body.email,
        });
        await newNewsletter.save();
        return res.status(200).json({
          message:
            "Votre adresse a bien été inscrite pour recevoir les prochaines actualités de la saga.",
        });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
