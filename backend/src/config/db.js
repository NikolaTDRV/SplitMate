const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// On teste la connexion
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion à PostgreSQL :', err.message);
  } else {
    console.log('✅ PostgreSQL est connecté et prêt !');
  }
});

module.exports = pool;