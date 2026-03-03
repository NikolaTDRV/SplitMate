const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http'); 
const { Server } = require('socket.io'); 
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const groupRoutes = require('./routes/groupRoutes'); // Import du collègue
require('dotenv').config();

const app = express();
const server = http.createServer(app); 
const io = new Server(server, { cors: { origin: "*" } }); 

// --- RATE LIMITING (Sécurité OWASP) ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par IP
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 tentatives de login max
  message: { error: 'Trop de tentatives de connexion, veuillez réessayer dans 1 heure.' },
});

// --- MIDDLEWARES (Sécurité OWASP) ---
app.use(helmet()); 
app.use(cors());
app.use(express.json());
app.use(limiter); // Rate limit global 

// Rendre 'io' accessible dans les contrôleurs
app.set('socketio', io);

// --- ROUTES ---
app.use('/api/auth', authLimiter, authRoutes); // Rate limit strict sur auth
app.use('/api/expenses', expenseRoutes);
app.use('/api/groups', groupRoutes); // Route du collègue ajoutée ici

// --- LOGIQUE SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('⚡ Un membre est en ligne');
  socket.on('join_coloc', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`User a rejoint le groupe : ${groupId}`);
  });
  socket.on('disconnect', () => {
    console.log('🔥 Un membre s\'est déconnecté');
  });
});

// --- ROUTES DE TEST ---
app.get('/', (req, res) => {
    res.send("🚀 Le serveur SplitMate est en ligne et opérationnel !");
});

app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: "API SplitMate connectée !", time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 5000;
// ON UTILISE SERVER.LISTEN (Indispensable pour tes WebSockets)
server.listen(PORT, () => {
  console.log(`🚀 Serveur et WebSockets lancés sur : http://localhost:${PORT}`);
});