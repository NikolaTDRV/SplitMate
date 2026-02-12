# SplitMate
Expense management app for friends

************************************************************************************************************

# SplitMate Backend - Documentation API

## Installation
1. `npm install`
2. Créer un fichier `.env` (DATABASE_URL, JWT_SECRET, PORT)
3. Importer `schema.sql` dans PostgreSQL

## Endpoints (URLs)

### Authentification (Public)
- `POST /api/auth/register` : { name, email, password }
- `POST /api/auth/login` : { email, password } -> Retourne un `token`

### Groupes (Privé - nécessite Header Authorization: Bearer <token>)
- `POST /api/groups` : { name, description } -> Crée une coloc
- `GET /api/groups` : Liste tes groupes

### Dépenses (À faire par Dev C)
- Tables prêtes : `expenses`