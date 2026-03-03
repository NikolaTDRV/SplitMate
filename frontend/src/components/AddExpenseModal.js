import React, { useState } from 'react';
import { expenseAPI } from '../services/api';
import './AddExpenseModal.css';

const AddExpenseModal = ({ groupId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    paid_by: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Le montant doit être positif');
      return;
    }

    setLoading(true);

    try {
      await expenseAPI.create({
        groupId: parseInt(groupId),
        title: formData.title,
        amount: parseFloat(formData.amount)
      });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-expense-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Ajouter une dépense</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Titre de la dépense</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Courses Carrefour"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Montant (€)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              disabled={loading}
            />
          </div>

          <div className="category-hints">
            <p>💡 Suggestions de catégories basées sur le titre :</p>
            <div className="category-pills">
              <span onClick={() => setFormData({...formData, title: 'Courses'})}>🛒 Courses</span>
              <span onClick={() => setFormData({...formData, title: 'Loyer'})}>🏠 Loyer</span>
              <span onClick={() => setFormData({...formData, title: 'Électricité'})}>💡 Électricité</span>
              <span onClick={() => setFormData({...formData, title: 'Restaurant'})}>🍕 Restaurant</span>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Ajout...' : 'Ajouter la dépense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
