const pool = require('../config/db');

/**
 * Calcule les balances nettes de chaque membre d'un groupe
 * et génère les transferts simplifiés (qui doit combien à qui)
 */
const getGroupBalances = async (groupId) => {
  // Récupérer toutes les dépenses du groupe
  const expensesQuery = await pool.query(
    'SELECT amount, paid_by FROM expenses WHERE group_id = $1', 
    [groupId]
  );

  // Récupérer la liste des membres du groupe avec leurs noms
  const membersQuery = await pool.query(
    `SELECT gm.user_id, u.name 
     FROM group_members gm 
     JOIN users u ON gm.user_id = u.id 
     WHERE gm.group_id = $1`,
    [groupId]
  );

  const members = membersQuery.rows;
  const expenses = expensesQuery.rows;
  
  if (members.length === 0) {
    return { balances: {}, transfers: [], total: 0 };
  }

  // Créer un map userId -> name
  const memberNames = {};
  members.forEach(m => {
    memberNames[m.user_id] = m.name;
  });

  // Initialiser les balances à 0 pour chaque utilisateur
  let balances = {};
  members.forEach(m => balances[m.user_id] = 0);

  let totalExpenses = 0;

  // Calcul : Pour chaque dépense, on divise par le nombre de membres
  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount);
    totalExpenses += amount;
    const share = amount / members.length;
    
    // Celui qui a payé récupère tout le montant
    if (balances[exp.paid_by] !== undefined) {
      balances[exp.paid_by] += amount;
    }
    
    // On retire la part de chaque membre (y compris celui qui a payé)
    members.forEach(m => {
      balances[m.user_id] -= share;
    });
  });

  // Arrondir les balances à 2 décimales
  Object.keys(balances).forEach(key => {
    balances[key] = Math.round(balances[key] * 100) / 100;
  });

  // Générer les transferts simplifiés (algorithme glouton)
  const transfers = calculateTransfers(balances, memberNames);

  return { 
    balances, 
    transfers,
    total: Math.round(totalExpenses * 100) / 100,
    memberNames
  };
};

/**
 * Algorithme pour simplifier les dettes
 * Retourne une liste de transferts: [{from, to, amount}]
 */
const calculateTransfers = (balances, memberNames) => {
  const transfers = [];
  
  // Séparer les créditeurs (balance > 0) et débiteurs (balance < 0)
  let creditors = [];
  let debtors = [];
  
  Object.entries(balances).forEach(([userId, amount]) => {
    if (amount > 0.01) {
      creditors.push({ userId, amount, name: memberNames[userId] });
    } else if (amount < -0.01) {
      debtors.push({ userId, amount: -amount, name: memberNames[userId] });
    }
  });

  // Trier par montant décroissant
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Algorithme glouton pour minimiser les transferts
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const transferAmount = Math.min(creditor.amount, debtor.amount);
    
    if (transferAmount > 0.01) {
      transfers.push({
        from: debtor.name,
        from_id: debtor.userId,
        to: creditor.name,
        to_id: creditor.userId,
        amount: Math.round(transferAmount * 100) / 100
      });
    }

    creditor.amount -= transferAmount;
    debtor.amount -= transferAmount;

    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount < 0.01) debtors.shift();
  }

  return transfers;
};

module.exports = { getGroupBalances };