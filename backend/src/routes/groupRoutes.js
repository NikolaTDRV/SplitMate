const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

// Toutes ces routes nécessitent d'être connecté (Token)
router.post('/', authMiddleware, groupController.createGroup);
router.get('/', authMiddleware, groupController.getUserGroups);
router.get('/:id', authMiddleware, groupController.getGroupById);
router.post('/:id/members', authMiddleware, groupController.addMember);
router.delete('/:id/members/:memberId', authMiddleware, groupController.removeMember); // Admin/Owner only
router.delete('/:id', authMiddleware, groupController.deleteGroup); // Admin/Owner only

module.exports = router;