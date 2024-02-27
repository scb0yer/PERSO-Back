require("dotenv").config();
const express = require("express");
const { connect, default: mongoose } = require("mongoose");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONGODB_URL + "Perso");

const mathsElevesRoutes = require("./MATHS/routes/eleve");
app.use(mathsElevesRoutes);

app.all("*", (req, res) => {
  return res.status(404).json("Not found");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server has started 🚀");
});
