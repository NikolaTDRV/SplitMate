const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// --- INSCRIPTION (REGISTER) ---
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // 1. Vérifier si l'utilisateur existe déjà (Critère OWASP : Validation)
        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(409).json({ error: "Cet email est déjà utilisé" }); // 409 Conflict
        }

        // 2. Hachage du mot de passe (Critère Sécurité OWASP)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insertion dans PostgreSQL
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role || 'member']
        );

        res.status(201).json(newUser.rows[0]); // 201 Created
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur serveur lors de l'inscription" });
    }
};

// --- CONNEXION (LOGIN) ---
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Chercher l'utilisateur
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        // 2. Vérification existence (Critère Sécurité : Erreur générique pour ne pas aider les hackers)
        if (!user) {
            return res.status(401).json({ error: "Identifiants incorrects" }); // 401 Unauthorized
        }

        // 3. Comparer le mot de passe avec bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Identifiants incorrects" });
        }

        // 4. Générer le Token JWT (Exigence Authentification JWT)
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // 5. Réponse avec le token et les infos de base
        res.status(200).json({
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur serveur lors de la connexion" });
    }
};