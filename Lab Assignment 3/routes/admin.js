const express = require("express");
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// Protect all admin routes
router.use(isAdmin);

router.get("/", adminController.redirectToDashboard);
router.get("/dashboard", adminController.dashboard);
router.get("/products/new", adminController.newProductPage);
router.post("/products", adminController.createProduct);
router.get("/products/edit/:id", adminController.editProductPage);
router.post("/products/update/:id", adminController.updateProduct);
router.post("/products/delete/:id", adminController.deleteProduct);
router.get('/orders', adminController.ordersPage);
router.post('/orders/update/:id', adminController.updateOrderStatus);

module.exports = router;