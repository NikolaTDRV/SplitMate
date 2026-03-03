import React, { useState } from 'react';
import { expenseAPI } from '../services/api';
import './ExpenseItem.css';

// Category icons mapping
const categoryIcons = {
  food: '🍕',
  groceries: '🛒',
  rent: '🏠',
  utilities: '💡',
  transport: '🚗',
  entertainment: '🎬',
  health: '💊',
  shopping: '🛍️',
  other: '📦'
};

const ExpenseItem = ({ expense, onRefresh, canDelete = true }) => {
  const [deleting, setDeleting] = useState(false);

  const getCategoryIcon = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('courses') || lowerTitle.includes('supermarché')) return categoryIcons.groceries;
    if (lowerTitle.includes('resto') || lowerTitle.includes('pizza') || lowerTitle.includes('nourriture')) return categoryIcons.food;
    if (lowerTitle.includes('loyer')) return categoryIcons.rent;
    if (lowerTitle.includes('électricité') || lowerTitle.includes('eau') || lowerTitle.includes('gaz')) return categoryIcons.utilities;
    if (lowerTitle.includes('uber') || lowerTitle.includes('taxi') || lowerTitle.includes('essence')) return categoryIcons.transport;
    if (lowerTitle.includes('netflix') || lowerTitle.includes('cinéma') || lowerTitle.includes('sortie')) return categoryIcons.entertainment;
    return categoryIcons.other;
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    
    setDeleting(true);
    try {
      await expenseAPI.delete(expense.id);
      onRefresh?.();
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className={`expense-item ${deleting ? 'deleting' : ''}`}>
      <div className="expense-icon">
        {getCategoryIcon(expense.title)}
      </div>
      
      <div className="expense-details">
        <h4 className="expense-title">{expense.title}</h4>
        <p className="expense-payer">
          Payé par <strong>{expense.paid_by_name || `Utilisateur #${expense.paid_by}`}</strong>
        </p>
      </div>
      
      <div className="expense-amount">
        {formatAmount(expense.amount)}
      </div>

      {canDelete && (
        <button 
          className="btn-delete"
          onClick={handleDelete}
          disabled={deleting}
          title="Supprimer"
        >
          🗑️
        </button>
      )}
    </div>
  );
};

export default ExpenseItem;
