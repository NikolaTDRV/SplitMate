import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupAPI, expenseAPI } from '../services/api'; // Fonctions pour appeler l'API
import socketService from '../services/socket'; // Service pour gérer la connexion WebSocket
import { useAuth } from '../context/AuthContext'; // Hook pour récupérer l'utilisateur connecté
import { useToast } from '../components/Toast'; // Hook pour afficher des notifications
import Navbar from '../components/Navbar';
import ExpenseList from '../components/ExpenseList';
import BalanceCard from '../components/BalanceCard';
import AddExpenseModal from '../components/AddExpenseModal';
import AddMemberModal from '../components/AddMemberModal';
import './GroupPage.css';

const GroupPage = () => {
  // --- HOOKS ET ÉTATS ---
  const { id } = useParams(); // Récupère l'ID du groupe depuis l'URL (ex: /group/123)
  const { user } = useAuth(); // Informations sur l'utilisateur actuellement connecté
  const { showToast } = useToast(); // Fonction pour afficher les notifications
  
  // États pour stocker les données du groupe
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  
  // États pour la gestion de l'UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false); // Gère la visibilité de la modale d'ajout de dépense
  const [showAddMember, setShowAddMember] = useState(false); // Gère la visibilité de la modale d'ajout de membre
  const [activeTab, setActiveTab] = useState('expenses'); // Gère l'onglet actif ('dépenses' ou 'équilibres')
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState(''); // Pour la recherche par titre
  const [filterPaidBy, setFilterPaidBy] = useState('all'); // Pour filtrer par membre

  // --- EFFETS (useEffect) ---

  // 1. Connexion et écoute des événements WebSocket
  useEffect(() => {
    socketService.connect(); // Établit la connexion au serveur WebSocket
    socketService.joinGroup(id); // Rejoint la "salle" correspondant à ce groupe pour recevoir les bons messages

    // Définit les actions à effectuer lors de la réception d'événements du serveur
    socketService.onNewExpense((data) => {
      if (showToast) showToast(data.message, 'success'); // Affiche une notif
      fetchGroupData(); // Recharge les données pour afficher la nouvelle dépense
    });

    socketService.onExpenseDeleted(() => {
      if (showToast) showToast('Une dépense a été supprimée', 'info');
      fetchGroupData();
    });

    socketService.onMemberJoined((data) => {
      if (showToast) showToast(data.message, 'success');
      fetchGroupData();
    });

    socketService.onMemberRemoved(() => {
      if (showToast) showToast('Un membre a été retiré du groupe', 'info');
      fetchGroupData();
    });

    // Fonction de nettoyage : s'exécute lorsque le composant est "démonté" (quand on quitte la page)
    return () => {
      socketService.removeAllListeners(); // Supprime les écouteurs pour éviter les fuites de mémoire
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Se ré-exécute si l'ID du groupe change

  // 2. Chargement initial des données du groupe
  useEffect(() => {
    fetchGroupData();
  }, [id]);

  // --- FONCTIONS ---

  // Fonction pour charger toutes les données de la page (détails, dépenses, équilibres)
  const fetchGroupData = async () => {
    try {
      setLoading(true);
      // Lance plusieurs requêtes API en parallèle pour plus d'efficacité
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        groupAPI.getById(id),
        expenseAPI.getAll(id),
        expenseAPI.getBalances(id)
      ]);
      
      // Met à jour les états avec les données reçues
      setGroup(groupRes.data);
      setMembers(groupRes.data.members || []);
      setExpenses(expensesRes.data || []);
      setBalances(balancesRes.data?.transfers || []);
    } catch (err) {
      setError('Erreur lors du chargement du groupe');
      console.error(err);
    } finally {
      setLoading(false); // Arrête l'indicateur de chargement, que la requête ait réussi ou non
    }
  };

  const handleExpenseAdded = () => {
    setShowAddExpense(false);
    fetchGroupData();
  };

  const handleMemberAdded = () => {
    setShowAddMember(false);
    fetchGroupData();
  };

  // --- LOGIQUE DE RENDU ---

  // Calcule les permissions de l'utilisateur (propriétaire ou admin)
  const isOwner = group?.owner_id === user?.id;
  const isAdmin = user?.role === 'admin';

  // Applique les filtres sur la liste des dépenses.
  // `useMemo` est utilisé pour optimiser : le filtrage n'est ré-exécuté que si les dépenses ou les filtres changent.
  const filteredExpenses = useMemo(() => expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaidBy = filterPaidBy === 'all' || expense.paid_by === parseInt(filterPaidBy);
    return matchesSearch && matchesPaidBy;
  }), [expenses, searchTerm, filterPaidBy]);

  // Si la page charge, on affiche un spinner
  if (loading) {
    return (
      <div className="dashboard-layout">
        <Navbar />
        <main className="group-main">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Chargement du groupe...</p>
          </div>
        </main>
      </div>
    );
  }

  // Rendu principal du composant
  return (
    <div className="dashboard-layout">
      <Navbar />
      
      <main className="group-main">
        <div className="group-header">
          <Link to="/dashboard" className="back-link">← Retour</Link>
          <div className="group-title">
            <h1>🏠 {group?.name}</h1>
            <p>{group?.description}</p>
          </div>
          <div className="group-actions">
            {isOwner && (
              <button 
                className="btn-add-member"
                onClick={() => setShowAddMember(true)}
              >
                👥 Inviter
              </button>
            )}
            <button 
              className="btn-add-expense"
              onClick={() => setShowAddExpense(true)}
            >
              + Dépense
            </button>
          </div>
        </div>

        {/* Liste des membres */}
        <div className="members-section">
          <h3>👥 Membres ({members.length})</h3>
          <div className="members-list">
            {members.map((member) => (
              <div key={member.id} className="member-chip">
                <span className="member-avatar">
                  {member.name.charAt(0).toUpperCase()}
                </span>
                <span className="member-name">{member.name}</span>
                {member.id === group?.owner_id && (
                  <span className="owner-badge">👑</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Onglets pour naviguer entre Dépenses et Équilibres */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            📝 Dépenses
          </button>
          <button 
            className={`tab ${activeTab === 'balances' ? 'active' : ''}`}
            onClick={() => setActiveTab('balances')}
          >
            💰 Équilibres
          </button>
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="tab-content">
          {activeTab === 'expenses' ? (
            <>
              {/* Section des filtres */}
              <div className="filters-section">
                <input
                  type="text"
                  placeholder="🔍 Rechercher une dépense..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-search"
                />
                <select
                  value={filterPaidBy}
                  onChange={(e) => setFilterPaidBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tous les membres</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <ExpenseList 
                expenses={filteredExpenses} 
                onRefresh={fetchGroupData}
                isAdmin={isAdmin}
                currentUserId={user?.id}
              />
            </>
          ) : (
            <div className="balances-grid">
              {balances.length === 0 ? (
                <div className="empty-balances">
                  <p>Aucun équilibre à calculer pour le moment.</p>
                </div>
              ) : (
                balances.map((balance, index) => (
                  <BalanceCard key={index} balance={balance} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Modale pour ajouter une dépense (affichée conditionnellement) */}
        {showAddExpense && (
          <AddExpenseModal
            groupId={id}
            onClose={() => setShowAddExpense(false)}
            onSuccess={handleExpenseAdded}
          />
        )}

        {/* Modale pour ajouter un membre (affichée conditionnellement) */}
        {showAddMember && (
          <AddMemberModal
            groupId={id}
            onClose={() => setShowAddMember(false)}
            onSuccess={handleMemberAdded}
          />
        )}
      </main>
    </div>
  );
};

export default GroupPage;
