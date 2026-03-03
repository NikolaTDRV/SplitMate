import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupAPI.getAll();
      setGroups(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des groupes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await groupAPI.create(newGroup);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Bonjour, {user?.name} 👋</h1>
            <p className="subtitle">Gérez vos dépenses de colocation</p>
          </div>
          {user?.role === 'admin' && (
            <button 
              className="btn-create"
              onClick={() => setShowCreateModal(true)}
            >
              + Nouveau groupe
            </button>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Chargement de vos groupes...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏠</span>
            <h2>Aucun groupe pour le moment</h2>
            <p>Créez un groupe ou demandez à être ajouté à une colocation existante.</p>
            {user?.role === 'admin' && (
              <button 
                className="btn-create"
                onClick={() => setShowCreateModal(true)}
              >
                Créer mon premier groupe
              </button>
            )}
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map((group) => (
              <Link 
                to={`/group/${group.id}`} 
                key={group.id} 
                className="group-card"
              >
                <div className="group-icon">🏠</div>
                <div className="group-info">
                  <h3>{group.name}</h3>
                  <p>{group.description || 'Aucune description'}</p>
                </div>
                <div className="group-arrow">→</div>
              </Link>
            ))}
          </div>
        )}

        {/* Modal de création */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Créer un nouveau groupe</h2>
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label>Nom du groupe</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    placeholder="Ex: Appartement Paris 11e"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description (optionnel)</label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    placeholder="Décrivez votre colocation..."
                    rows="3"
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={creating}
                  >
                    {creating ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
