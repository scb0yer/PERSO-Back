const { timingSafeEqual } = require("node:crypto");

// Cette fonction séparée permet aussi de tester la route sans base réelle.
module.exports = function createStudentHandler({ Student, Classe, bcrypt }) {
  return async (req, res) => {
    const secret = process.env.ADMIN_API_KEY;
    if (!secret || secret.length < 32 || secret.startsWith("remplacer-")) {
      return res.status(503).json({ error: "Création des élèves non configurée." });
    }
    const received = Buffer.from(req.get("x-admin-key") || "");
    const expected = Buffer.from(secret);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return res.status(403).json({ error: "Accès administrateur requis." });
    }

    const { name, password, classe, avatar = "" } = req.body || {};
    if (typeof name !== "string" || !name.trim() || name.length > 100
        || typeof password !== "string" || password.length < 8 || Buffer.byteLength(password) > 72
        || typeof classe !== "string" || !/^[a-f0-9]{24}$/i.test(classe)
        || typeof avatar !== "string" || avatar.length > 500) {
      return res.status(400).json({ error: "Pseudo, classe valide et mot de passe de 8 caractères minimum (72 octets maximum) requis. Avatar : chaîne de 500 caractères maximum." });
    }
    if (!await Classe.exists({ _id: classe })) {
      return res.status(404).json({ error: "Classe introuvable." });
    }
    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const student = await Student.create({ name: name.trim(), password: passwordHash, classe, avatar });
      // Liste explicite : ne jamais renvoyer le hash, même sur un document nouvellement créé.
      return res.status(201).json({ student: {
        id: student._id, name: student.name, classe: student.classe, avatar: student.avatar,
      } });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: "Ce pseudo est déjà utilisé." });
      throw error;
    }
  };
};
