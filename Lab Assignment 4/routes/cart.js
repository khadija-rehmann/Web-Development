// Shopping Cart Routes
// This file handles all cart operations: adding items, viewing, removing, and clearing
// Cart is stored in session (req.session.cart) as a simple array

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isLoggedIn } = require('../middleware/auth');

router.post('/cart/add/:productId', isLoggedIn, cartController.addToCart);
router.get('/cart', isLoggedIn, cartController.getCart);
router.post('/cart/remove/:productId', isLoggedIn, cartController.removeFromCart);
router.post('/cart/clear', isLoggedIn, cartController.clearCart);
router.post('/checkout/confirm', isLoggedIn, cartController.confirmOrder);

module.exports = router;
