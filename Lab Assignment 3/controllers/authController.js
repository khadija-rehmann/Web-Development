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

exports.checkout = (req, res) => {
  const cart = req.session.cart || [];
  let total = 0;

  for (const item of cart) {
    total += item.price * item.quantity;
  }

  res.render('checkout', { cart, total });
};