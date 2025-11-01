const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireSupremeAdmin } = require('../middleware/auth');

// All user routes require authentication and supreme admin role
router.use(authenticateToken);
router.use(requireSupremeAdmin);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;