const pool = require('../config/db');

exports.createGroup = async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id; // Récupéré via le token JWT par le middleware

    try {
        // 1. Créer le groupe dans la table 'groups'
        const groupResult = await pool.query(
            'INSERT INTO groups (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
            [name, description, userId]
        );
        const newGroup = groupResult.rows[0];

        // 2. Ajouter le créateur comme membre dans 'group_members'
        await pool.query(
            'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
            [newGroup.id, userId]
        );

        res.status(201).json({
            message: "Groupe créé avec succès !",
            group: newGroup
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors de la création du groupe" });
    }
};

// Optionnel : Lister les groupes de l'utilisateur connecté
exports.getUserGroups = async (req, res) => {
    try {
        const groups = await pool.query(
            'SELECT g.* FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = $1',
            [req.user.id]
        );
        res.json(groups.rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération des groupes" });
    }
};