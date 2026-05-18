const Order = require('../models/Order');

function calculateLivePriceFromProduct(product) {
  const basePrice = Number(product.price) || 0;
  if (product.isOnSale) {
    const validSalePrice = Number(product.salePrice) > 0 && Number(product.salePrice) < basePrice;
    return {
      originalPrice: basePrice,
      salePrice: validSalePrice ? Number(product.salePrice) : Math.round(basePrice * 0.8),
      isOnSale: true
    };
  }

  return {
    originalPrice: basePrice,
    salePrice: null,
    isOnSale: false
  };
}

function getCartUnitPrice(item) {
  if (item.isOnSale) {
    return Number(item.salePrice) || Number(item.price) || 0;
  }
  return Number(item.price) || 0;
}

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

    // Build up-to-date sale pricing data from the latest product values.
    const livePricing = calculateLivePriceFromProduct(product);

    // If product not found in cart, add it as a new item with quantity 1
    if (!itemFound) {
      req.session.cart.push({
        productId: product._id,
        name: product.name,
        price: livePricing.isOnSale ? livePricing.salePrice : livePricing.originalPrice,
        originalPrice: livePricing.originalPrice,
        salePrice: livePricing.salePrice,
        isOnSale: livePricing.isOnSale,
        image: product.image,
        quantity: 1
      });
    } else {
      // If item exists already, keep pricing in sync with current product values.
      req.session.cart = req.session.cart.map((item) => {
        if (item.productId.toString() !== productId) return item;
        return {
          ...item,
          price: livePricing.isOnSale ? livePricing.salePrice : livePricing.originalPrice,
          originalPrice: livePricing.originalPrice,
          salePrice: livePricing.salePrice,
          isOnSale: livePricing.isOnSale
        };
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

exports.getCart = async (req, res) => {
  try {
    // Get cart from session, or use empty array if cart doesn't exist
    let cart = req.session.cart || [];

    // Refresh cart prices from DB so sale price is shown correctly everywhere.
    if (cart.length > 0) {
      const Product = require('../models/Product');
      const productIds = cart.map(item => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(products.map(p => [p._id.toString(), p]));

      cart = cart.map((item) => {
        const latestProduct = productMap.get(item.productId.toString());
        if (!latestProduct) return item;

        const livePricing = calculateLivePriceFromProduct(latestProduct);
        return {
          ...item,
          name: latestProduct.name,
          image: latestProduct.image,
          price: livePricing.isOnSale ? livePricing.salePrice : livePricing.originalPrice,
          originalPrice: livePricing.originalPrice,
          salePrice: livePricing.salePrice,
          isOnSale: livePricing.isOnSale
        };
      });

      req.session.cart = cart;
    }

    // Calculate total price by looping through all items
    let total = 0;
    for (let item of cart) {
      total += getCartUnitPrice(item) * item.quantity;
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

    if (Object.values(deliveryAddress).some((value) => !value)) {//If any address field is empty
      req.flash('error', 'Please complete all delivery address fields.');
      return res.redirect('/checkout');
    }

    let totalPrice = 0;
    for (let item of cart) {
      totalPrice += getCartUnitPrice(item) * item.quantity;
    }

    const newOrder = new Order({
      customerName: req.session.user.name,//Gets log in user data from session.
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