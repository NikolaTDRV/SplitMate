const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http'); // AJOUT
const { Server } = require('socket.io'); // AJOUT
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
require('dotenv').config();

const app = express();
const server = http.createServer(app); // AJOUT : On crée le serveur HTTP
const io = new Server(server, { cors: { origin: "*" } }); // AJOUT : Socket.io

// Middlewares
app.use(helmet()); 
app.use(cors());
app.use(express.json()); 
app.use('/api/expenses', expenseRoutes);

// Rendre 'io' accessible dans les contrôleurs (pour les notifications)
app.set('socketio', io);

app.use('/api/auth', authRoutes);

// --- LOGIQUE SOCKET.IO (Ta partie) ---
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

// Route de test
app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: "API SplitMate connectée !", time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
// ATTENTION : On utilise server.listen et non app.listen
server.listen(PORT, () => {
  console.log(`🚀 Serveur et WebSockets lancés sur : http://localhost:${PORT}`);
});