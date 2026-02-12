const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/db'); // Import de la connexion DB
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();

// --- MIDDLEWARES (Sécurité OWASP) ---
app.use(helmet()); 
app.use(cors());
app.use(express.json()); 
app.use('/api/auth', authRoutes);

// --- ROUTE DE TEST ---
app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: "API SplitMate connectée !", time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur : http://localhost:${PORT}`);
});