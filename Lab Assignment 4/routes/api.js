const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Import models from the existing project
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const verifyToken = require('../middleware/verifyToken');

// ------------------------------------------------------------------
// PUBLIC ROUTE 1 — Get all products with filtering and pagination
// GET /api/v1/products
// Public route — anyone can access this
// Supports query parameters: ?page=1 & ?search=name & ?category=X & ?minPrice=X & ?maxPrice=X
router.get('/products', async (req, res) => {
    try {
        // Step 1: Get query parameters, use defaults if not provided
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : 999999999;
        const productsPerPage = 8;

        // Step 2: Build the filter object step by step
        const filter = {};

        // Add search filter if search term provided
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        // Add category filter if category provided
        if (category) {
            filter.category = category;
        }

        // Add price range filter
        filter.price = { $gte: minPrice, $lte: maxPrice };

        // Step 3: Count total matching products for pagination
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / productsPerPage);

        // Step 4: Get the products for this page
        const products = await Product.find(filter)
            .skip((page - 1) * productsPerPage)
            .limit(productsPerPage);

        // Step 5: Return JSON response
        res.status(200).json({
            success: true,
            totalProducts: totalProducts,
            totalPages: totalPages,
            currentPage: page,
            products: products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products.',
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// PUBLIC ROUTE 2 — Get a single product by ID
// GET /api/v1/products/:id
// Public route — anyone can access this
// Returns one product by its MongoDB ID
router.get('/products/:id', async (req, res) => {
    try {
        // Find product by ID from the URL parameter
        const product = await Product.findById(req.params.id);

        // If product not found, return 404
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        // Return the product
        res.status(200).json({
            success: true,
            product: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product.',
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// AUTH ROUTE — Login and get JWT token
// POST /api/v1/auth/login
// Public route — anyone can call this to get a token
// Send: { email: "...", password: "..." } in request body
// Returns: JWT token if credentials are correct
router.post('/auth/login', async (req, res) => {
    try {
        // Step 1: Get email and password from request body
        const { email, password } = req.body;

        // Step 2: Check if both fields are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password.'
            });
        }

        // Step 3: Find the user in database by email
        const user = await User.findOne({ email: email });

        // Step 4: If user not found, return error
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Step 5: Check if password is correct
        // comparePassword() is defined in models/User.js
        const isPasswordCorrect = await user.comparePassword(password);

        // Step 6: If password wrong, return error
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Step 7: Password is correct — create a JWT token
        // The token contains user_id and role
        const token = jwt.sign(
            {
                user_id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        // Step 8: Return the token to the client
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token: token
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login.',
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// PROTECTED ROUTE 1 — Get user profile (requires JWT)
// GET /api/v1/user/profile
// Protected route — requires valid JWT token in Authorization header
// Send header: Authorization: Bearer <token>
router.get('/user/profile', verifyToken, async (req, res) => {
    try {
        // req.user is set by verifyToken middleware
        // It contains user_id and role from the token

        // Find the user in database using ID from token
        const user = await User.findById(req.user.user_id);

        // If user not found
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Return user data — do NOT send the password
        res.status(200).json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile.',
            error: error.message
        });
    }
});

// ------------------------------------------------------------------
// PROTECTED ROUTE 2 — Submit an order (requires JWT)
// POST /api/v1/orders
// Protected route — requires valid JWT token
// Send: { items: [ { productId, name, price, image, quantity } ], deliveryAddress: { ... } }
// NOTE: The Order model in this project requires a deliveryAddress object
router.post('/orders', verifyToken, async (req, res) => {
    try {
        // Step 1: Get items from request body
        const items = req.body.items;
        const deliveryAddress = req.body.deliveryAddress;

        // Step 2: Check if items exist and are not empty
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items provided in order.'
            });
        }

        // Step 2b: Check deliveryAddress because Order schema requires it
        if (!deliveryAddress || !deliveryAddress.name || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.postalCode || !deliveryAddress.phone || !deliveryAddress.country) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a complete deliveryAddress object with name, street, city, postalCode, phone, country.'
            });
        }

        // Step 3: Get user info using ID from token
        const user = await User.findById(req.user.user_id);

        // Step 4: Calculate total price with a simple loop
        let totalPrice = 0;
        for (let item of items) {
            totalPrice += item.price * item.quantity;
        }

        // Step 5: Create and save the order to database
        const newOrder = new Order({
            customerName: user.name,
            customerEmail: user.email,
            deliveryAddress: deliveryAddress,
            items: items,
            totalPrice: totalPrice,
            status: 'Pending'
        });
        await newOrder.save();

        // Step 6: Return success response
        res.status(201).json({
            success: true,
            message: 'Order placed successfully.',
            order: {
                orderId: newOrder.orderId,
                customerName: newOrder.customerName,
                totalPrice: newOrder.totalPrice,
                status: newOrder.status,
                itemCount: items.length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error placing order.',
            error: error.message
        });
    }
});

module.exports = router;
