import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupAPI, expenseAPI } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Navbar from '../components/Navbar';
import ExpenseList from '../components/ExpenseList';
import BalanceCard from '../components/BalanceCard';
import AddExpenseModal from '../components/AddExpenseModal';
import AddMemberModal from '../components/AddMemberModal';
import './GroupPage.css';

const GroupPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaidBy, setFilterPaidBy] = useState('all');

  // WebSocket connection
  useEffect(() => {
    socketService.connect();
    socketService.joinGroup(id);

    // Notifications temps réel
    socketService.onNewExpense((data) => {
      showToast(data.message, 'success');
      fetchGroupData();
    });

    socketService.onExpenseDeleted(() => {
      showToast('Une dépense a été supprimée', 'info');
      fetchGroupData();
    });

    socketService.onMemberJoined((data) => {
      showToast(data.message, 'success');
      fetchGroupData();
    });

    socketService.onMemberRemoved(() => {
      showToast('Un membre a été retiré du groupe', 'info');
      fetchGroupData();
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [id, showToast]);

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        groupAPI.getById(id),
        expenseAPI.getAll(id),
        expenseAPI.getBalances(id)
      ]);
      
      setGroup(groupRes.data);
      setMembers(groupRes.data.members || []);
      setExpenses(expensesRes.data || []);
      
      // Use transfers from the new balance API
      const balancesData = balancesRes.data || {};
      setBalances(balancesData.transfers || []);
    } catch (err) {
      setError('Erreur lors du chargement du groupe');
      console.error(err);
    } finally {
      setLoading(false);
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

  const isOwner = group?.owner_id === user?.id;
  const isAdmin = user?.role === 'admin';

  // Filtrer les dépenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaidBy = filterPaidBy === 'all' || expense.paid_by === parseInt(filterPaidBy);
    return matchesSearch && matchesPaidBy;
  });

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

        {/* Tabs */}
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

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'expenses' ? (
            <>
              {/* Filtres */}
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
                  <p>Aucune balance pour le moment</p>
                </div>
              ) : (
                balances.map((balance, index) => (
                  <BalanceCard key={index} balance={balance} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal d'ajout de dépense */}
        {showAddExpense && (
          <AddExpenseModal
            groupId={id}
            onClose={() => setShowAddExpense(false)}
            onSuccess={handleExpenseAdded}
          />
        )}

        {/* Modal d'ajout de membre */}
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
