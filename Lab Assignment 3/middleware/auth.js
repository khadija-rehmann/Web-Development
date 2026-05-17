module.exports.isLoggedIn = (req, res, next) => {
  if (!req.session || !req.session.user) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
  }
  next();
};

module.exports.isAdmin = (req, res, next) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Access Denied. Admins only.');
    return res.status(403).render('auth/access-denied');
  }
  next();
};
