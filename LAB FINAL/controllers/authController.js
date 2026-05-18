const User = require('../models/User');

exports.registerPage = (req, res) => {
  res.render('auth/register');
};

exports.register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/register');
  }
  if (password !== confirmPassword) {
    req.flash('error', "Passwords don't match.");
    return res.redirect('/register');
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      req.flash('error', 'Email already in use.');
      return res.redirect('/register');
    }

    //created account
    const user = new User({ name: name.trim(), email: email.toLowerCase(), password, role: 'customer' });
    await user.save();
    req.flash('success', 'Account created! Please log in.');
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/register');
  }
};

exports.loginPage = (req, res) => {
  res.render('auth/login');
};

//check login info
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash('error', 'Email and password are required.');
    return res.redirect('/login');
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    const match = await user.comparePassword(password);
    if (!match) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.user = { _id: user._id, name: user.name, email: user.email, role: user.role };
    req.flash('success', `Welcome back, ${user.name}!`);
    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'An error occurred. Please try again.');
    return res.redirect('/login');
  }
};

exports.logout = (req, res) => {
  req.flash('success', 'You have successfully logged out.');
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/');
  });
};

exports.profile = (req, res) => {
  res.render('profile');
};

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

exports.checkout = async (req, res) => {
  let cart = req.session.cart || [];//if session cart exists use it otherwise use empty array

  // Refresh cart item prices from DB so checkout always shows latest sale cuts.
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

  let total = 0;

  for (const item of cart) {
    total += getCartUnitPrice(item) * item.quantity;
  }

  res.render('checkout', { cart, total });
};