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

// Récupérer toutes les dépenses d'un groupe
const getExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const result = await pool.query(
      `SELECT e.*, u.name as paid_by_name 
       FROM expenses e 
       LEFT JOIN users u ON e.paid_by = u.id 
       WHERE e.group_id = $1 
       ORDER BY e.created_at DESC`,
      [groupId]
    );
    
    res.json(result.rows);
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

// Supprimer une dépense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier que la dépense existe
    const expense = await pool.query(
      'SELECT * FROM expenses WHERE id = $1',
      [id]
    );

    if (expense.rows.length === 0) {
      return res.status(404).json({ error: 'Dépense non trouvée' });
    }

    // Vérifier les permissions : admin peut tout supprimer, member seulement ses dépenses
    if (userRole !== 'admin' && expense.rows[0].paid_by !== userId) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres dépenses' });
    }

    // Supprimer la dépense
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);

    // Notification temps réel
    const io = req.app.get('socketio');
    io.to(`group_${expense.rows[0].group_id}`).emit('expense_deleted', {
      expenseId: id,
      deletedBy: userId
    });

    res.json({ message: 'Dépense supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addExpense, getExpenses, getBalances, deleteExpense };