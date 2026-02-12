const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Récupérer le token dans le header "Authorization"
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }

    try {
        // 2. Vérifier si le token est valide
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Ajouter les infos de l'utilisateur à la requête pour les prochaines étapes
        req.user = decoded;
        next(); // On laisse passer à la suite
    } catch (err) {
        res.status(401).json({ error: "Token invalide ou expiré." });
    }
};

module.exports = authMiddleware;