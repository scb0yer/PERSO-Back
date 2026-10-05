const express = require("express");
const bcrypt = require("bcryptjs");
const { rateLimit } = require("express-rate-limit");
const Student = require("../models/Student");
const Classe = require("../models/Class");
const Attempt = require("../models/Attempt");
const Exercice = require("../models/Exercice");
const { validAttempt, percent } = require("../validation");
const router = express.Router();
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Trop de tentatives de connexion. Réessayez plus tard." },
});
const dummyHash = bcrypt.hashSync("not-an-account-password", 12);
const profile = (s) => ({
  id: s._id,
  name: s.name,
  classe: s.classe,
  avatar: s.avatar,
});

router.post(
  "/auth/login",
  loginLimiter,
  wrap(async (req, res) => {
    const { name, password } = req.body || {};
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 100 ||
      typeof password !== "string" ||
      !password ||
      Buffer.byteLength(password) > 72
    ) {
      return res
        .status(400)
        .json({ error: "Pseudo et mot de passe requis (72 octets maximum)." });
    }
    const student = await Student.findOne({ name: name.trim() }).select(
      "+password",
    );
    const valid = await bcrypt.compare(
      password,
      student?.password || dummyHash,
    );
    if (!student || !valid)
      return res.status(401).json({ error: "Identifiants incorrects." });
    await new Promise((resolve, reject) =>
      req.session.regenerate((e) => (e ? reject(e) : resolve())),
    );
    req.session.studentId = student._id.toString();
    await new Promise((resolve, reject) =>
      req.session.save((e) => (e ? reject(e) : resolve())),
    );
    res.json({ student: profile(student) });
  }),
);

router.post(
  "/auth/logout",
  wrap(async (req, res) => {
    await new Promise((resolve, reject) =>
      req.session.destroy((e) => (e ? reject(e) : resolve())),
    );
    res.clearCookie("eleves.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(204).end();
  }),
);

const createStudent = require("./create-student")({
  Student,
  Classe,
  bcrypt,
});

router.post("/students", wrap(createStudent));

// Toutes les routes suivantes nécessitent une session valide.
router.use(
  wrap(async (req, res, next) => {
    if (!req.session.studentId)
      return res.status(401).json({ error: "Connexion requise." });
    const student = await Student.findById(req.session.studentId);
    if (!student) return res.status(401).json({ error: "Compte introuvable." });
    req.student = student;
    next();
  }),
);

async function classDashboard(classId) {
  const classe = await Classe.findById(classId).lean();
  if (!classe) return null;
  const [attemptCount, studentCount] = await Promise.all([
    Attempt.countDocuments({ classId: classe._id }),
    Student.countDocuments({ classe: classe._id }),
  ]);
  return {
    id: classe._id,
    name: classe.name,
    target: classe.target || 0,
    attemptCount,
    studentCount,
    percentage: percent(attemptCount, classe.target),
    goalConfigured: classe.target > 0,
    metric: "recordedAttempts",
    period: "allTime",
  };
}

router.get(
  "/students/me/dashboard",
  wrap(async (req, res) => {
    const [stats, recentAttempts, classe] = await Promise.all([
      Attempt.aggregate([
        { $match: { studentId: req.student._id } },
        {
          $group: {
            _id: null,
            attemptCount: { $sum: 1 },
            averagePercentage: {
              $avg: {
                $cond: [
                  { $gt: ["$maxScore", 0] },
                  { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
                  null,
                ],
              },
            },
          },
        },
      ]),
      Attempt.find({ studentId: req.student._id })
        .sort({ date: -1 })
        .limit(10)
        .populate("exerciceId", "name subject area difficulty")
        .lean(),
      classDashboard(req.student.classe),
    ]);
    res.json({
      student: profile(req.student),
      stats: {
        attemptCount: stats[0]?.attemptCount || 0,
        averagePercentage:
          stats[0]?.averagePercentage == null
            ? null
            : Math.round(stats[0].averagePercentage),
        scoreSource: "client-unverified",
      },
      recentAttempts,
      classe,
    });
  }),
);

router.post(
  "/attempt",
  wrap(async (req, res) => {
    if (!validAttempt(req.body))
      return res.status(400).json({
        error:
          "Tentative invalide : exerciceId, submissionId, score et maxScore requis.",
      });
    const { exerciceId, submissionId, score, maxScore } = req.body;
    // Si le navigateur renvoie la même soumission, aucune seconde contribution.
    const previous = await Attempt.findOne({
      studentId: req.student._id,
      submissionId,
    });
    const replay = (attempt) => {
      if (
        attempt.exerciceId.toString() !== exerciceId ||
        attempt.score !== score ||
        attempt.maxScore !== maxScore
      )
        return res
          .status(409)
          .json({ error: "submissionId déjà utilisé avec un autre contenu." });
      return res.status(200).json({ attempt, replayed: true });
    };
    if (previous) return replay(previous);
    if (!(await Exercice.exists({ _id: exerciceId })))
      return res.status(404).json({ error: "Exercice introuvable." });
    if (!(await Classe.exists({ _id: req.student.classe })))
      return res.status(409).json({ error: "Classe introuvable." });
    try {
      const attempt = await Attempt.create({
        studentId: req.student._id,
        classId: req.student.classe,
        exerciceId,
        submissionId,
        score,
        maxScore,
        scoreVerified: false,
      }); // À remplacer par une correction serveur lorsque disponible.
      res.status(201).json({ attempt, replayed: false });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const existing = await Attempt.findOne({
        studentId: req.student._id,
        submissionId,
      });
      if (!existing) throw error;
      return replay(existing);
    }
  }),
);

router.get(
  "/classes/:id/dashboard",
  wrap(async (req, res) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.id))
      return res.status(400).json({ error: "Identifiant invalide." });
    if (req.student.classe.toString() !== req.params.id.toLowerCase())
      return res.status(403).json({ error: "Accès limité à votre classe." });
    const dashboard = await classDashboard(req.student.classe);
    if (!dashboard)
      return res.status(404).json({ error: "Classe introuvable." });
    res.json(dashboard);
  }),
);
module.exports = router;
