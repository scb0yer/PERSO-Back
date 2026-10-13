// Les 14 identifiants existants sont ceux fournis par Sophie le 10 octobre 2026.
// Les 4 nouvelles entrées correspondent au script create-statistics.js.
module.exports = [
  {
    "exerciceId": "6ac47e12d53233f67aed5e6d",
    "activity": "division",
    "mode": "equality"
  },
  {
    "exerciceId": "6ac47d8bd53233f67aed5e6b",
    "activity": "division",
    "mode": "division"
  },
  {
    "exerciceId": "6ac47df8d53233f67aed5e6c",
    "activity": "division",
    "mode": "operation"
  },
  {
    "exerciceId": "6ac4b451d53233f67aed5e82",
    "activity": "diviseurs",
    "mode": "recognize"
  },
  {
    "exerciceId": "6ac4b519d53233f67aed5e83",
    "activity": "diviseurs",
    "mode": "list"
  },
  {
    "exerciceId": "6ac54524d53233f67aed5e84",
    "activity": "pgcd",
    "mode": "choose"
  },
  {
    "exerciceId": "6ac54536d53233f67aed5e85",
    "activity": "pgcd",
    "mode": "write"
  },
  {
    "exerciceId": "6ac55603d53233f67aed5e86",
    "activity": "fractions",
    "mode": "factors"
  },
  {
    "exerciceId": "6ac55634d53233f67aed5e87",
    "activity": "fractions",
    "mode": "gcd"
  },
  {
    "exerciceId": "6aca6cf3898086337989c2fa",
    "activity": "additions et soustractions de fractions",
    "mode": "same"
  },
  {
    "exerciceId": "6aca6d36898086337989c2fb",
    "activity": "additions et soustractions de fractions",
    "mode": "multiple"
  },
  {
    "exerciceId": "6aca6d41898086337989c2fc",
    "activity": "additions et soustractions de fractions",
    "mode": "product"
  },
  {
    "exerciceId": "6aca9113898086337989c2fd",
    "activity": "multiplication de fractions",
    "mode": "integer"
  },
  {
    "exerciceId": "6aca913b898086337989c2fe",
    "activity": "multiplication de fractions",
    "mode": "fractions"
  },
  {
    "exerciceId": "005179b209ab31451746b8cb",
    "activity": "statistics",
    "mode": "frequency"
  },
  {
    "exerciceId": "574ca34cf870bce2a88a42fd",
    "activity": "statistics",
    "mode": "mean"
  },
  {
    "exerciceId": "de0f315fbada56fbc4feae1d",
    "activity": "statistics",
    "mode": "median"
  },
  {
    "exerciceId": "6f00c0ec5425b5ed8870553a",
    "activity": "statistics",
    "mode": "range"
  }
].filter(item => /^[a-f0-9]{24}$/i.test(item.exerciceId));
