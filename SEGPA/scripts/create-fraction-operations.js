require('dotenv').config();
const mongoose=require('mongoose');
const Exercice=require('../models/Exercice');
const exercises=[
  {
    "_id": "9c01ecaf747690d29abdf5d0",
    "name": "Fractions — addition et soustraction, même dénominateur",
    "subject": "Mathématiques",
    "area": "Calculs de fractions",
    "difficulty": 1,
    "rewardPolicy": "standard5"
  },
  {
    "_id": "0caedec589d6c90a444125bf",
    "name": "Fractions — dénominateur double ou triple",
    "subject": "Mathématiques",
    "area": "Calculs de fractions",
    "difficulty": 2,
    "rewardPolicy": "standard5"
  },
  {
    "_id": "c80e6511cbc2133a8d8d5d72",
    "name": "Fractions — produit des dénominateurs",
    "subject": "Mathématiques",
    "area": "Calculs de fractions",
    "difficulty": 3,
    "rewardPolicy": "standard5"
  }
];
async function main(){
 if(!process.env.MONGODB_URL)throw Error('MONGODB_URL absente. Lance cette commande depuis la racine du backend.');
 await mongoose.connect(process.env.MONGODB_URL+'Perso');
 for(const exercise of exercises){
  const existing=await Exercice.findById(exercise._id).lean();
  if(existing&&existing.name!==exercise.name)throw Error('Identifiant déjà utilisé : '+exercise._id+'. Aucun exercice existant n’a été remplacé.');
  await Exercice.updateOne({_id:exercise._id},{$setOnInsert:exercise},{upsert:true});
  console.log(exercise.name+' : '+exercise._id);
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
