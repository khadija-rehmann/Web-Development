const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');//Import authentication logic.
const { isLoggedIn } = require('../middleware/auth');

router.get('/register', authController.registerPage);
router.post('/register', authController.register);
router.get('/login', authController.loginPage);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/profile', isLoggedIn, authController.profile);
router.get('/checkout', isLoggedIn, authController.checkout);

module.exports = router;
