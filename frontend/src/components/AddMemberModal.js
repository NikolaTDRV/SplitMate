import React, { useState } from 'react';
import { groupAPI } from '../services/api';
import './AddMemberModal.css';

const AddMemberModal = ({ groupId, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError("L'email est requis");
      return;
    }

    setLoading(true);

    try {
      const response = await groupAPI.addMember(groupId, email);
      setSuccess(response.data.message);
      setEmail('');
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-member-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Inviter un colocataire</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <p className="modal-description">
            Entrez l'adresse email d'un utilisateur inscrit sur SplitMate pour l'ajouter à votre groupe.
          </p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label htmlFor="email">Email du colocataire</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coloc@email.com"
              required
              disabled={loading}
            />
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
              {loading ? 'Envoi...' : 'Inviter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
