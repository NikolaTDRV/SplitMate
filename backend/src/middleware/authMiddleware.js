const jwt = require('jsonwebtoken'); // Librairie pour créer et vérifier les JSON Web Tokens

const authMiddleware = (req, res, next) => {
    // 1. Récupérer le token du header 'Authorization'. Le format est "Bearer <token>".
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Accès refusé. Format de token invalide ou manquant." });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        // 2. Vérifier si le token est valide et non expiré en utilisant le secret.
        // `jwt.verify` décode le token ou lève une erreur s'il est invalide.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Si le token est valide, on attache les informations de l'utilisateur (`id`, `role`)
        // à l'objet `req`. Ainsi, les prochains middlewares ou contrôleurs y auront accès.
        req.user = decoded;
        
        // 4. On laisse la requête continuer vers sa destination (le contrôleur).
        next();
    } catch (err) {
        // Si `jwt.verify` échoue (token expiré, signature incorrecte, etc.)
        res.status(401).json({ error: "Token invalide ou expiré." });
    }
};

module.exports = authMiddleware;