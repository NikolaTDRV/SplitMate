const pool = require('../config/db');

/**
 * Calcule les balances nettes de chaque membre d'un groupe
 */
const getGroupBalances = async (groupId) => {
  // Récupérer toutes les dépenses du groupe
  const expensesQuery = await pool.query(
    'SELECT amount, paid_by FROM expenses WHERE group_id = $1', 
    [groupId]
  );

  // Récupérer la liste des membres du groupe
  const membersQuery = await pool.query(
    'SELECT user_id FROM group_members WHERE group_id = $1',
    [groupId]
  );

  const members = membersQuery.rows;
  const expenses = expensesQuery.rows;
  
  // Initialiser les balances à 0 pour chaque utilisateur
  let balances = {};
  members.forEach(m => balances[m.user_id] = 0);

  // Calcul : Pour chaque dépense, on divise par le nombre de membres
  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount);
    const share = amount / members.length;
    
    // Celui qui a payé récupère tout le montant
    balances[exp.paid_by] += amount;
    
    // On retire la part de chaque membre (y compris celui qui a payé)
    members.forEach(m => {
      balances[m.user_id] -= share;
    });
  });

  return balances;
};

module.exports = { getGroupBalances };