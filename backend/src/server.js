const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/db'); // Import de la connexion DB
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes'); // Import des routes groupes
require('dotenv').config();

const app = express();

// --- MIDDLEWARES (Sécurité OWASP) ---
app.use(helmet()); 
app.use(cors());
app.use(express.json()); // Indispensable pour lire le JSON dans les requêtes

// --- ROUTES ---
app.use('/api/auth', authRoutes);   // Routes pour Inscription/Connexion
app.use('/api/groups', groupRoutes); // Routes pour les Groupes (Colocs)

// --- ROUTE DE TEST DB ---
app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: "API SplitMate connectée !", time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROUTE D'ACCUEIL ---
app.get('/', (req, res) => {
    res.send("🚀 Le serveur SplitMate est en ligne et opérationnel !");
});

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur : http://localhost:${PORT}`);
});