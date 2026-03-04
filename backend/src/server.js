// --- IMPORTATIONS ESSENTIELLES ---
const express = require('express'); // Framework pour construire le serveur
const cors = require('cors'); // Middleware pour autoriser les requêtes cross-origin (entre le frontend et le backend)
const helmet = require('helmet'); // Middleware pour sécuriser les en-têtes HTTP (protection OWASP)
const rateLimit = require('express-rate-limit'); // Middleware pour limiter le nombre de requêtes (protection OWASP)
const http = require('http'); // Module natif de Node.js pour créer un serveur HTTP
const { Server } = require('socket.io'); // Classe pour gérer les WebSockets
const pool = require('./config/db'); // Notre module de connexion à la base de données PostgreSQL

// --- IMPORTATION DES ROUTES ---
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const groupRoutes = require('./routes/groupRoutes');
require('dotenv').config(); // Charge les variables d'environnement du fichier .env

// --- INITIALISATION ---
const app = express(); // Crée une instance de l'application Express
const server = http.createServer(app); // Crée un serveur HTTP basé sur l'app Express (nécessaire pour Socket.IO)
const io = new Server(server, { cors: { origin: "*" } }); // Initialise Socket.IO et l'attache au serveur HTTP

// --- MIDDLEWARES DE SÉCURITÉ (OWASP) ---

// 1. Rate Limiter Global : Limite toutes les IPs à 100 requêtes par 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Fenêtre de temps : 15 minutes
  max: 100, // Nombre maximum de requêtes dans la fenêtre de temps
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
  standardHeaders: true, // Active les en-têtes standards `RateLimit-*`
  legacyHeaders: false, // Désactive les anciens en-têtes `X-RateLimit-*`
});

// 2. Rate Limiter pour l'Authentification : Plus strict, 10 tentatives par heure
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 tentatives max
  message: { error: 'Trop de tentatives de connexion, veuillez réessayer dans 1 heure.' },
});

// --- APPLICATION DES MIDDLEWARES ---
app.use(helmet()); // Applique les en-têtes de sécurité
app.use(cors()); // Autorise les requêtes de n'importe quelle origine
app.use(express.json()); // Permet au serveur de comprendre le JSON envoyé dans les corps de requête (req.body)
app.use(limiter); // Applique le rate limiter global à toutes les routes

// --- GESTION DE SOCKET.IO ---
// Rend l'instance 'io' accessible dans toute l'application (via req.app.get('socketio'))
// C'est crucial pour pouvoir émettre des événements depuis les contrôleurs.
app.set('socketio', io);

// --- DÉFINITION DES ROUTES PRINCIPALES ---
// Applique le `authLimiter` uniquement aux routes d'authentification
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/groups', groupRoutes);

// --- LOGIQUE WEBSOCKET ---
// Se déclenche chaque fois qu'un nouveau client se connecte au serveur WebSocket
io.on('connection', (socket) => {
  console.log('⚡ Un membre est en ligne via WebSocket');

  // Écoute l'événement 'join_group' émis par un client"
  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`); // Fait rejoindre au client une "salle" spécifique à son groupe
    console.log(`Un utilisateur a rejoint la salle du groupe : ${groupId}`);
  });

  // Se déclenche lorsque le client se déconnecte
  socket.on('disconnect', () => {
    console.log('🔥 Un membre s\'est déconnecté');
  });
});

// --- ROUTE DE TEST SIMPLE ---
app.get('/', (req, res) => {
    res.send("🚀 Le serveur SplitMate est en ligne et opérationnel !");
});

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 5000;
// On utilise `server.listen` au lieu de `app.listen` pour démarrer le serveur HTTP
// qui contient à la fois l'application Express ET le serveur Socket.IO.
server.listen(PORT, () => {
  console.log(`🚀 Serveur et WebSockets lancés sur : http://localhost:${PORT}`);
});