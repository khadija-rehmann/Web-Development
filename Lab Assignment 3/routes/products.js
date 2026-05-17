const express = require("express");
const router = express.Router();
const productController = require('../controllers/productController');

router.get("/", productController.homepage);
router.get("/women", productController.women);
router.get("/men", productController.men);
router.get("/girls", productController.girls);
router.get('/category/unstitched', productController.unstitched);
router.get('/category/ready-to-wear', productController.readyToWear);
router.get('/category/fragrances', productController.fragrances);
router.get('/category/bags', productController.bags);
router.get('/category/footwear', productController.footwear);
router.get('/category/men', productController.redirectMen);
router.get('/category/girls', productController.redirectGirls);
router.get("/contact-us", productController.contactUs);
router.get("/products", productController.products);

module.exports = router;
