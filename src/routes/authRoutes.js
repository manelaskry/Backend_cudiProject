const express = require('express');
const router = express.Router();
const { register, login, googleAuth, checkEmail, checkEmailByToken, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/check-email', checkEmail); 
router.post('/check-email-by-token', checkEmailByToken);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;