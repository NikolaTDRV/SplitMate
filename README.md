# SplitMate
Application de gestion des dépenses partagées entre colocataires/amis.

---

## 🏗️ Architecture

- **Frontend:** React.js (Create React App)
- **Backend:** Node.js + Express
- **Base de données:** PostgreSQL
- **Temps réel:** Socket.IO (WebSockets)
- **Authentification:** JWT (JSON Web Tokens)

---

## 📦 Installation

### Backend
```bash
cd backend
npm install
# Créer .env avec DATABASE_URL, JWT_SECRET, EXCHANGE_API_KEY
# Importer schema.sql dans PostgreSQL
node src/server.js
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## 🔐 Rôles Utilisateurs

| Rôle | Permissions |
|------|-------------|
| **member** | Créer groupes, ajouter dépenses, supprimer ses propres dépenses |
| **admin** | Tout ce que member + supprimer toutes dépenses, retirer des membres |

---

## 📡 Documentation API

### Authentification (Public)

#### POST /api/auth/register
Créer un nouveau compte utilisateur.
```json
{
  "method": "POST",
  "path": "/api/auth/register",
  "auth": false,
  "params": {
    "body": {
      "name": "string (requis)",
      "email": "string (requis)",
      "password": "string (requis)",
      "role": "string (optionnel, default: 'member')"
    }
  },
  "return": { "id": "number", "name": "string", "email": "string", "role": "string" },
  "statuses": [201, 409, 500]
}
```

#### POST /api/auth/login
Se connecter et obtenir un token JWT.
```json
{
  "method": "POST",
  "path": "/api/auth/login",
  "auth": false,
  "params": {
    "body": {
      "email": "string (requis)",
      "password": "string (requis)"
    }
  },
  "return": { "token": "string", "user": { "id": "number", "name": "string", "role": "string" } },
  "statuses": [200, 401, 500]
}
```

---

### Groupes (Privé - Token requis)

#### POST /api/groups
Créer un nouveau groupe.
```json
{
  "method": "POST",
  "path": "/api/groups",
  "auth": "Bearer <token>",
  "params": {
    "body": {
      "name": "string (requis)",
      "description": "string (optionnel)"
    }
  },
  "return": { "message": "string", "group": { "id": "number", "name": "string", "owner_id": "number" } },
  "statuses": [201, 401, 500]
}
```

#### GET /api/groups
Lister tous les groupes de l'utilisateur.
```json
{
  "method": "GET",
  "path": "/api/groups",
  "auth": "Bearer <token>",
  "params": null,
  "return": [{ "id": "number", "name": "string", "description": "string", "owner_id": "number" }],
  "statuses": [200, 401, 500]
}
```

#### GET /api/groups/:id
Récupérer les détails d'un groupe avec ses membres.
```json
{
  "method": "GET",
  "path": "/api/groups/:id",
  "auth": "Bearer <token>",
  "params": { "url": { "id": "number (group_id)" } },
  "return": {
    "id": "number",
    "name": "string",
    "members": [{ "id": "number", "name": "string", "email": "string", "role": "string" }]
  },
  "statuses": [200, 401, 403, 404, 500]
}
```

#### POST /api/groups/:id/members
Ajouter un membre au groupe (owner uniquement).
```json
{
  "method": "POST",
  "path": "/api/groups/:id/members",
  "auth": "Bearer <token>",
  "params": {
    "url": { "id": "number (group_id)" },
    "body": { "email": "string (requis)" }
  },
  "return": { "message": "string", "member": { "id": "number", "name": "string" } },
  "statuses": [201, 401, 403, 404, 409, 500]
}
```

#### DELETE /api/groups/:id/members/:memberId
Retirer un membre du groupe (admin/owner uniquement).
```json
{
  "method": "DELETE",
  "path": "/api/groups/:id/members/:memberId",
  "auth": "Bearer <token>",
  "params": {
    "url": { "id": "number (group_id)", "memberId": "number (user_id)" }
  },
  "return": { "message": "Membre retiré du groupe avec succès" },
  "statuses": [200, 400, 401, 403, 404, 500]
}
```

#### DELETE /api/groups/:id
Supprimer un groupe (admin/owner uniquement).
```json
{
  "method": "DELETE",
  "path": "/api/groups/:id",
  "auth": "Bearer <token>",
  "params": { "url": { "id": "number (group_id)" } },
  "return": { "message": "Groupe supprimé avec succès" },
  "statuses": [200, 401, 403, 404, 500]
}
```

---

### Dépenses (Privé - Token requis)

#### POST /api/expenses
Ajouter une nouvelle dépense.
```json
{
  "method": "POST",
  "path": "/api/expenses",
  "auth": "Bearer <token>",
  "params": {
    "body": {
      "groupId": "number (requis)",
      "title": "string (requis)",
      "amount": "number (requis)",
      "currency": "string (optionnel, default: 'EUR')"
    }
  },
  "return": { "id": "number", "group_id": "number", "paid_by": "number", "title": "string", "amount": "number" },
  "statuses": [201, 401, 500]
}
```

#### GET /api/expenses/group/:groupId
Récupérer toutes les dépenses d'un groupe.
```json
{
  "method": "GET",
  "path": "/api/expenses/group/:groupId",
  "auth": "Bearer <token>",
  "params": { "url": { "groupId": "number" } },
  "return": [{ "id": "number", "title": "string", "amount": "number", "paid_by": "number", "paid_by_name": "string", "created_at": "timestamp" }],
  "statuses": [200, 401, 500]
}
```

#### GET /api/expenses/balances/:groupId
Calculer les balances et transferts d'un groupe.
```json
{
  "method": "GET",
  "path": "/api/expenses/balances/:groupId",
  "auth": "Bearer <token>",
  "params": { "url": { "groupId": "number" } },
  "return": {
    "balances": { "userId": "number (balance nette)" },
    "transfers": [{ "from": "string", "to": "string", "amount": "number" }],
    "total": "number"
  },
  "statuses": [200, 401, 500]
}
```

#### DELETE /api/expenses/:id
Supprimer une dépense (propre dépense ou admin).
```json
{
  "method": "DELETE",
  "path": "/api/expenses/:id",
  "auth": "Bearer <token>",
  "params": { "url": { "id": "number (expense_id)" } },
  "return": { "message": "Dépense supprimée avec succès" },
  "statuses": [200, 401, 403, 404, 500]
}
```

---

## 🔒 Sécurité (OWASP Top 10)

| Mesure | Implémentation |
|--------|----------------|
| **Helmet** | Headers HTTP sécurisés |
| **Rate Limiting** | 100 req/15min (global), 10 req/h (auth) |
| **JWT** | Tokens signés avec expiration 24h |
| **Password Hashing** | bcrypt avec salt (10 rounds) |
| **Input Validation** | Vérification des paramètres requis |
| **SQL Injection** | Requêtes paramétrées (pg) |

---

## 🌐 Service Externe

- **API ExchangeRate** : Conversion automatique des devises vers EUR
- URL: `https://v6.exchangerate-api.com/v6/{API_KEY}/pair/{FROM}/EUR/{AMOUNT}`

---

## 📱 WebSockets Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_coloc` | Client → Server | Rejoindre un groupe |
| `new_expense_added` | Server → Client | Nouvelle dépense ajoutée |
| `expense_deleted` | Server → Client | Dépense supprimée |
| `member_joined` | Server → Client | Nouveau membre |
| `member_removed` | Server → Client | Membre retiré |

---

## 📄 Pages Frontend

| Page | Route | Auth | Description |
|------|-------|------|-------------|
| Home | `/` | ❌ | Page d'accueil publique |
| Login | `/login` | ❌ | Connexion |
| Register | `/register` | ❌ | Inscription |
| Dashboard | `/dashboard` | ✅ | Liste des groupes |
| Group | `/group/:id` | ✅ | Détails groupe + dépenses |