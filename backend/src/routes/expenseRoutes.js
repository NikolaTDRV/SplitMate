const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, getBalances, deleteExpense } = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware'); 

// Route pour ajouter une dépense (protégée)
router.post('/', authMiddleware, addExpense); 

// Route pour récupérer les dépenses d'un groupe (protégée)
router.get('/group/:groupId', authMiddleware, getExpenses);

// Route pour voir qui doit combien (protégée)
router.get('/balances/:groupId', authMiddleware, getBalances);

// Route pour supprimer une dépense (protégée)
router.delete('/:id', authMiddleware, deleteExpense);

module.exports = router;