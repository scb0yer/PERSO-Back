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
  {
    exerciceId: "6ac54524d53233f67aed5e84",
    activity: "pgcd",
    mode: "choose",
  },
  {
    exerciceId: "6ac54536d53233f67aed5e85",
    activity: "pgcd",
    mode: "write",
  },
  {
    exerciceId: "6ac55603d53233f67aed5e86",
    activity: "fractions",
    mode: "factors",
  },
  {
    exerciceId: "6ac55634d53233f67aed5e87",
    activity: "fractions",
    mode: "gcd",
  },
  {
    exerciceId: "6aca6cf3898086337989c2fa",
    activity: "additions et soustractions de fractions",
    mode: "same",
  },
  {
    exerciceId: "6aca6d36898086337989c2fb",
    activity: "additions et soustractions de fractions",
    mode: "multiple",
  },
  {
    exerciceId: "6aca6d41898086337989c2fc",
    activity: "additions et soustractions de fractions",
    mode: "product",
  },
].filter((item) => /^[a-f0-9]{24}$/i.test(item.exerciceId));
