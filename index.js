require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

const mongoUrl = process.env.MONGODB_URL + "Perso";
const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ||
  process.env.FRONTEND_ORIGIN ||
  ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const production = process.env.NODE_ENV === "production";

if (
  allowedOrigins.length === 0 ||
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 32
) {
  throw new Error(
    "Configurez FRONTEND_ORIGIN et SESSION_SECRET (32 caractères minimum).",
  );
}

// À renseigner uniquement selon la configuration de votre hébergement.
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);

if (!Number.isInteger(proxyHops) || proxyHops < 0) {
  throw new Error("TRUST_PROXY_HOPS doit être un entier positif ou nul.");
}

if (proxyHops > 0) {
  app.set("trust proxy", proxyHops);
}

// CORS avec cookies pour SEGPA, comportement existant pour les autres projets.
const segpaCors = cors({
  origin: allowedOrigins,
  credentials: true,
});

const otherCors = cors();

app.use((req, res, next) => {
  const isSegpa = req.path === "/segpa" || req.path.startsWith("/segpa/");

  return isSegpa ? segpaCors(req, res, next) : otherCors(req, res, next);
});

app.use(express.json());

// Protection des requêtes qui modifient les données SEGPA.
app.use("/segpa", (req, res, next) => {
  res.set("Cache-Control", "no-store");

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    if (!allowedOrigins.includes(req.get("origin"))) {
      return res.status(403).json({ error: "Origine interdite." });
    }

    if (!req.is("application/json")) {
      return res.status(415).json({ error: "JSON requis." });
    }
  }

  next();
});

// Sessions réservées aux routes SEGPA.
app.use(
  "/segpa",
  session({
    name: "eleves.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: production,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    },
  }),
);

// SEGPA
const segpaRoutes = require("./SEGPA/routes/api");
app.use("/segpa", segpaRoutes);

// Empêche une URL SEGPA inconnue de passer dans les autres projets.
app.use("/segpa", (req, res) => {
  res.status(404).json({ error: "Route SEGPA introuvable." });
});

// MATHS — ancien projet
const mathsElevesRoutes = require("./MATHS/routes/eleve");
app.use(mathsElevesRoutes);

// ROMAN
const romanMailRoutes = require("./ROMAN/routes/mail");
app.use(romanMailRoutes);

const romanStatisticsRoutes = require("./ROMAN/routes/statistic");
app.use(romanStatisticsRoutes);

const romanPaymentRoutes = require("./ROMAN/routes/payment");
app.use(romanPaymentRoutes);

const romanOrderRoutes = require("./ROMAN/routes/order");
app.use(romanOrderRoutes);

const romanCharacterRoutes = require("./ROMAN/routes/character");
app.use(romanCharacterRoutes);

const romanNewsletterRoutes = require("./ROMAN/routes/newsletter");
app.use(romanNewsletterRoutes);

const romanPlayersRoutes = require("./ROMAN/routes/player");
app.use(romanPlayersRoutes);

const romanQuestionnaireRoutes = require("./ROMAN/routes/questionnaire");
app.use(romanQuestionnaireRoutes);

// Route introuvable
app.use((req, res) => {
  res.status(404).json("Not found");
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON invalide." });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Requête trop volumineuse." });
  }

  console.error("Erreur API :", err.name, err.code || "");

  res.status(500).json({ error: "Erreur interne du serveur." });
});

// Connexion à MongoDB avant d'accepter les requêtes.
async function start() {
  await mongoose.connect(mongoUrl);

  await Promise.all([
    require("./SEGPA/models/Student").init(),
    require("./SEGPA/models/Attempt").init(),
  ]);

  app.listen(process.env.PORT || 3001, () => {
    console.log("Server has started 🚀");
  });
}

start().catch((error) => {
  console.error("Démarrage impossible :", error.message);
  process.exit(1);
});
