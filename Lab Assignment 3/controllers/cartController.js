const Order = require('../models/Order');

exports.addToCart = async (req, res) => {
  try {
    // Get the product ID from the URL parameter
    const productId = req.params.productId;

    // Find the product in database using Product model
    const Product = require('../models/Product');
    const product = await Product.findById(productId);

    // If product not found, redirect back with error message
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('back');
    }

    // Initialize cart array in session if it doesn't exist yet
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if this product already exists in the cart
    // Loop through cart array to find matching productId
    let itemFound = false;
    for (let item of req.session.cart) {
      if (item.productId.toString() === productId) {
        // Product already in cart: increase quantity by 1
        item.quantity += 1;
        itemFound = true;
        break;
      }
    }

    // If product not found in cart, add it as a new item with quantity 1
    if (!itemFound) {
      req.session.cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }

    // Save the session and redirect back with success message
    req.session.save((err) => {
      if (err) {
        req.flash('error', 'Error adding item to cart.');
        return res.redirect('back');
      }
      req.flash('success', 'Item added to cart!');
      res.redirect('back');
    });

  } catch (err) {
    console.error('Error adding to cart:', err);
    req.flash('error', 'Error adding item to cart.');
    res.redirect('back');
  }
};

exports.getCart = (req, res) => {
  try {
    // Get cart from session, or use empty array if cart doesn't exist
    const cart = req.session.cart || [];

    // Calculate total price by looping through all items
    let total = 0;
    for (let item of cart) {
      total += item.price * item.quantity;
    }

    // Render cart page with cart items and calculated total
    res.render('cart', { cart, total });

  } catch (err) {
    console.error('Error viewing cart:', err);
    req.flash('error', 'Error loading cart.');
    res.redirect('/');
  }
};

exports.removeFromCart = (req, res) => {
  try {
    // Get the product ID from URL parameter
    const productId = req.params.productId;

    // Initialize empty cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Filter out the item with matching productId
    // This removes the item from cart array
    req.session.cart = req.session.cart.filter(
      item => item.productId.toString() !== productId
    );

    // Save session and redirect to cart with success message
    req.session.save((err) => {
      if (err) {
        req.flash('error', 'Error removing item.');
        return res.redirect('/cart');
      }
      req.flash('success', 'Item removed from cart.');
      res.redirect('/cart');
    });

  } catch (err) {
    console.error('Error removing from cart:', err);
    req.flash('error', 'Error removing item from cart.');
    res.redirect('/cart');
  }
};

exports.clearCart = (req, res) => {
  try {
    // Set cart to empty array
    req.session.cart = [];

    // Save session and redirect to cart with success message
    req.session.save((err) => {
      if (err) {
        req.flash('error', 'Error clearing cart.');
        return res.redirect('/cart');
      }
      req.flash('success', 'Cart cleared.');
      res.redirect('/cart');
    });

  } catch (err) {
    console.error('Error clearing cart:', err);
    req.flash('error', 'Error clearing cart.');
    res.redirect('/cart');
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
      req.flash('error', 'Your cart is empty.');
      return res.redirect('/cart');
    }

    const { name, street, city, postalCode, phone, country } = req.body;
    const deliveryAddress = {
      name: name ? name.trim() : '',
      street: street ? street.trim() : '',
      city: city ? city.trim() : '',
      postalCode: postalCode ? postalCode.trim() : '',
      phone: phone ? phone.trim() : '',
      country: country ? country.trim() : ''
    };

    if (Object.values(deliveryAddress).some((value) => !value)) {
      req.flash('error', 'Please complete all delivery address fields.');
      return res.redirect('/checkout');
    }

    let totalPrice = 0;
    for (let item of cart) {
      totalPrice += item.price * item.quantity;
    }

    const newOrder = new Order({
      customerName: req.session.user.name,
      customerEmail: req.session.user.email,
      deliveryAddress,
      items: cart,
      totalPrice,
      status: 'Pending',
      createdAt: new Date()
    });
    await newOrder.save();

    req.session.cart = [];

    req.session.save((err) => {
      if (err) {
        console.error('Error saving session after placing order:', err);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect('/checkout');
      }
      req.flash('success', 'Your order has been placed successfully!');
      res.redirect('/');
    });
  } catch (error) {
    console.error('Error placing order:', error);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/checkout');
  }
};