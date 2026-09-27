const { Router } = require('express');
const authController = require('../controllers/authController');
const { validateSignup, validateSignin } = require('../validators/authValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = Router();

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/signin', validateSignin, authController.signin);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.post('/signout', authenticateToken, authController.signout);

module.exports = router;
