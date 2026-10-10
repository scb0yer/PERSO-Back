require("dotenv").config();
const mongoose = require("mongoose");
const Exercice = require("../models/Exercice");
const exercises = [
  {
    _id: "6aca9113898086337989c2fd",
    name: "Multiplier une fraction par un entier",
    subject: "Mathématiques",
    area: "multiplication de fractions",
    difficulty: 1,
    rewardPolicy: "standard5",
  },
  {
    _id: "6aca913b898086337989c2fe",
    name: "Multiplier deux fractions",
    subject: "Mathématiques",
    area: "multiplication de fractions",
    rewardPolicy: "standard5",
    difficulty: 2,
  },
];
async function main() {
  if (!process.env.MONGODB_URL)
    throw Error(
      "MONGODB_URL absente. Lance cette commande depuis la racine du backend.",
    );
  await mongoose.connect(process.env.MONGODB_URL + "Perso");
  for (const exercise of exercises) {
    const existing = await Exercice.findById(exercise._id).lean();
    if (existing && existing.name !== exercise.name)
      throw Error(
        "Identifiant déjà utilisé : " +
          exercise._id +
          ". Aucun exercice existant n’a été remplacé.",
      );
    await Exercice.updateOne(
      { _id: exercise._id },
      { $setOnInsert: exercise },
      { upsert: true },
    );
    console.log(exercise.name + " : " + exercise._id);
  }
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
