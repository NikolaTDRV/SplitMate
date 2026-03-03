const pool = require('../config/db');
const { getGroupBalances } = require('../services/balanceService');
const { convertToEuro } = require('../services/currencyService');

const addExpense = async (req, res) => {
  try {
    const { groupId, title, amount, currency } = req.body;
    const userId = req.user.id; // Récupéré via le middleware d'auth du Dev 1

    // 1. Utilisation de ton service de conversion (Feature externe)
    const finalAmount = await convertToEuro(amount, currency || 'EUR');

    // 2. Insertion en base de données
    const newExpense = await pool.query(
      'INSERT INTO expenses (group_id, paid_by, title, amount) VALUES ($1, $2, $3, $4) RETURNING *',
      [groupId, userId, title, finalAmount]
    );

    // 3. Notification temps réel (Feature Confort)
    const io = req.app.get('socketio');
    io.to(`group_${groupId}`).emit('new_expense_added', {
      message: `Nouvelle dépense : ${title} (${finalAmount}€)`,
      user: req.user.name
    });

    res.status(201).json(newExpense.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    // Utilisation de ton service de calcul
    const balances = await getGroupBalances(groupId);
    res.json(balances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addExpense, getBalances };