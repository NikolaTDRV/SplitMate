import React from 'react';
import './BalanceCard.css';

const BalanceCard = ({ balance }) => {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount));
  };

  return (
    <div className="balance-card">
      <div className="balance-transfer">
        <div className="balance-person debtor">
          <span className="person-avatar">
            {balance.from?.charAt(0).toUpperCase()}
          </span>
          <span className="person-name">{balance.from}</span>
        </div>
        
        <div className="balance-arrow-section">
          <span className="balance-arrow">→</span>
          <span className="balance-amount">{formatAmount(balance.amount)}</span>
        </div>
        
        <div className="balance-person creditor">
          <span className="person-avatar">
            {balance.to?.charAt(0).toUpperCase()}
          </span>
          <span className="person-name">{balance.to}</span>
        </div>
      </div>

      <p className="balance-description">
        <strong>{balance.from}</strong> doit <strong>{formatAmount(balance.amount)}</strong> à <strong>{balance.to}</strong>
      </p>
    </div>
  );
};

export default BalanceCard;
