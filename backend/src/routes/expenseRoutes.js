const express = require('express');
const router = express.Router();
const { addExpense, getBalances } = require('../controllers/expenseController');
// Attention : tu auras besoin du middleware d'auth du Dev 1 ici
// const authMiddleware = require('../middleware/authMiddleware'); 

// Route pour ajouter une dépense
router.post('/', addExpense); 

// Route pour voir qui doit combien
router.get('/balances/:groupId', getBalances);

module.exports = router;