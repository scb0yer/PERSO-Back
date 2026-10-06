// Seulement les activités publiées et ouvrables dans le frontend.
// Identifiants repris de ton fichier app/maths3eme/_lib/config.js.
// Lors d'un ajout, compléter aussi le catalogue et l'ouverture côté frontend.
module.exports = [
  {
    exerciceId: "6ac47e12d53233f67aed5e6d",
    activity: "division",
    mode: "equality",
  },
  {
    exerciceId: "6ac47d8bd53233f67aed5e6b",
    activity: "division",
    mode: "division",
  },
  {
    exerciceId: "6ac47df8d53233f67aed5e6c",
    activity: "division",
    mode: "operation",
  },
  {
    exerciceId: "6ac4b451d53233f67aed5e82",
    activity: "diviseurs",
    mode: "recognize",
  },
  {
    exerciceId: "6ac4b519d53233f67aed5e83",
    activity: "diviseurs",
    mode: "list",
  },
].filter((item) => /^[a-f0-9]{24}$/i.test(item.exerciceId));
