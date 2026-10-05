const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  // Contient uniquement un hash bcrypt, jamais un mot de passe en clair.
  password: { type: String, required: true, select: false },
  classe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classe",
    required: true,
  },
  avatar: { type: String, default: "" },
});
module.exports = mongoose.model("Student", schema);
