const express = require("express");
const Character = require("../models/Character");
const router = express.Router();

// Créer un personnage
router.post("/ROMAN/character", async (req, res) => {
  try {
    const newCharacter = new Character({
      name: req.body.name,
      img: req.body.img,
      description: req.body.description,
      age: req.body.age,
      gift: req.body.gift,
      gemme: req.body.gemme,
      race: req.body.race,
      siblings: req.body.siblings,
      chapters: req.body.chapters,
    });
    await newCharacter.save();
    return res.status(200).json({
      message: "Le personnage a bien été créé.",
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// Récupérer les personnages
router.get("/ROMAN/characters", async (req, res) => {
  try {
    const characters = new Character.find();
    return res.status(200).json(characters);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
