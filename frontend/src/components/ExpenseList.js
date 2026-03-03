import React from 'react';
import ExpenseItem from './ExpenseItem';
import './ExpenseList.css';

const ExpenseList = ({ expenses, onRefresh, isAdmin, currentUserId }) => {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="expense-list-empty">
        <span className="empty-icon">📝</span>
        <h3>Aucune dépense</h3>
        <p>Ajoutez votre première dépense pour commencer à suivre vos comptes.</p>
      </div>
    );
  }

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = new Date(expense.created_at).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {});

  return (
    <div className="expense-list">
      {Object.entries(groupedExpenses).map(([date, dayExpenses]) => (
        <div key={date} className="expense-group">
          <h4 className="expense-date">{date}</h4>
          {dayExpenses.map((expense) => (
            <ExpenseItem 
              key={expense.id} 
              expense={expense}
              onRefresh={onRefresh}
              canDelete={isAdmin || expense.paid_by === currentUserId}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;
