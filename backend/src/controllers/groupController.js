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

// Lister les groupes de l'utilisateur connecté
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

// Récupérer les détails d'un groupe avec ses membres
exports.getGroupById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Vérifier que l'utilisateur est membre du groupe
        const memberCheck = await pool.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: "Vous n'êtes pas membre de ce groupe" });
        }

        // Récupérer le groupe
        const groupResult = await pool.query(
            'SELECT * FROM groups WHERE id = $1',
            [id]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: "Groupe non trouvé" });
        }

        // Récupérer les membres
        const membersResult = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, gm.joined_at 
             FROM users u 
             JOIN group_members gm ON u.id = gm.user_id 
             WHERE gm.group_id = $1`,
            [id]
        );

        res.json({
            ...groupResult.rows[0],
            members: membersResult.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors de la récupération du groupe" });
    }
};

// Ajouter un membre au groupe par email
exports.addMember = async (req, res) => {
    const { id } = req.params; // group id
    const { email } = req.body;
    const userId = req.user.id;

    try {
        // Vérifier que l'utilisateur est owner du groupe
        const groupCheck = await pool.query(
            'SELECT * FROM groups WHERE id = $1 AND owner_id = $2',
            [id, userId]
        );

        if (groupCheck.rows.length === 0) {
            return res.status(403).json({ error: "Seul le propriétaire peut ajouter des membres" });
        }

        // Trouver l'utilisateur par email
        const userResult = await pool.query(
            'SELECT id, name, email FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Aucun utilisateur trouvé avec cet email" });
        }

        const newMember = userResult.rows[0];

        // Vérifier s'il est déjà membre
        const existingMember = await pool.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
            [id, newMember.id]
        );

        if (existingMember.rows.length > 0) {
            return res.status(409).json({ error: "Cet utilisateur est déjà membre du groupe" });
        }

        // Ajouter le membre
        await pool.query(
            'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
            [id, newMember.id]
        );

        // Notification temps réel
        const io = req.app.get('socketio');
        io.to(`group_${id}`).emit('member_joined', {
            message: `${newMember.name} a rejoint le groupe !`,
            member: newMember
        });

        res.status(201).json({
            message: `${newMember.name} a été ajouté au groupe`,
            member: newMember
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors de l'ajout du membre" });
    }
};

// Retirer un membre du groupe (admin ou owner uniquement)
exports.removeMember = async (req, res) => {
    const { id, memberId } = req.params; // group id et member id
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Vérifier que l'utilisateur est owner du groupe OU admin global
        const groupCheck = await pool.query(
            'SELECT * FROM groups WHERE id = $1',
            [id]
        );

        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ error: "Groupe non trouvé" });
        }

        const isOwner = groupCheck.rows[0].owner_id === userId;
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Seul le propriétaire ou un admin peut retirer des membres" });
        }

        // Empêcher de retirer le propriétaire
        if (parseInt(memberId) === groupCheck.rows[0].owner_id) {
            return res.status(400).json({ error: "Impossible de retirer le propriétaire du groupe" });
        }

        // Vérifier que l'utilisateur est membre
        const memberCheck = await pool.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
            [id, memberId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(404).json({ error: "Ce membre n'est pas dans le groupe" });
        }

        // Retirer le membre
        await pool.query(
            'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
            [id, memberId]
        );

        // Notification temps réel
        const io = req.app.get('socketio');
        io.to(`group_${id}`).emit('member_removed', {
            memberId: memberId,
            removedBy: userId
        });

        res.json({ message: "Membre retiré du groupe avec succès" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors du retrait du membre" });
    }
};

// Supprimer un groupe (owner ou admin uniquement)
exports.deleteGroup = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const groupCheck = await pool.query(
            'SELECT * FROM groups WHERE id = $1',
            [id]
        );

        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ error: "Groupe non trouvé" });
        }

        const isOwner = groupCheck.rows[0].owner_id === userId;
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Seul le propriétaire ou un admin peut supprimer ce groupe" });
        }

        // Supprimer les dépenses, membres, puis le groupe
        await pool.query('DELETE FROM expenses WHERE group_id = $1', [id]);
        await pool.query('DELETE FROM group_members WHERE group_id = $1', [id]);
        await pool.query('DELETE FROM groups WHERE id = $1', [id]);

        res.json({ message: "Groupe supprimé avec succès" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors de la suppression du groupe" });
    }
};