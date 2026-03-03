import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <nav className="home-nav">
        <div className="home-brand">🏠 SplitMate</div>
        <div className="home-nav-links">
          <Link to="/login" className="nav-btn">Connexion</Link>
          <Link to="/register" className="nav-btn primary">S'inscrire</Link>
        </div>
      </nav>

      <main className="home-hero">
        <div className="hero-content">
          <h1>Gérez vos dépenses de colocation <span>sans prise de tête</span></h1>
          <p>
            SplitMate vous permet de suivre qui a payé quoi, calculer automatiquement 
            les équilibres et savoir exactement combien vous devez à vos colocataires.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-hero primary">
              Commencer gratuitement
            </Link>
            <Link to="/login" className="btn-hero secondary">
              J'ai déjà un compte
            </Link>
          </div>
        </div>

        <div className="hero-features">
          <div className="feature-card">
            <span className="feature-icon">📝</span>
            <h3>Suivi des dépenses</h3>
            <p>Ajoutez facilement toutes les dépenses partagées</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💰</span>
            <h3>Calcul automatique</h3>
            <p>SplitMate calcule qui doit combien à qui</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👥</span>
            <h3>Groupes multiples</h3>
            <p>Gérez plusieurs colocations en même temps</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <h3>Mobile-friendly</h3>
            <p>Accessible partout, même en faisant les courses</p>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>SplitMate © 2026 - Projet académique</p>
      </footer>
    </div>
  );
};

export default HomePage;
