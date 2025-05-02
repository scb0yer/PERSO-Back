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
      quote: req.body.quote,
      imgStatic: req.body.imgStatic,
      pronunciation: req.body.pronunciation,
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
    const characters = await Character.find().sort({ name: 1 });
    return res.status(200).json(characters);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/ROMAN/charactersName", async (req, res) => {
  try {
    const names = await Character.find().sort({ name: 1 }).select("name");
    return res.status(200).json(names);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/ROMAN/character/:id", async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    return res.status(200).json({ character });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
