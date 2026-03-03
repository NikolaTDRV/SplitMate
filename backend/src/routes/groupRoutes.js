const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

// Toutes ces routes nécessitent d'être connecté (Token)
router.post('/', authMiddleware, groupController.createGroup);
router.get('/', authMiddleware, groupController.getUserGroups);

module.exports = router;