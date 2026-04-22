const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
  try {
    // Lis depuis le cookie httpOnly
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Non autorisé - Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();

  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Seller-only middleware
exports.sellerOnly = (req, res, next) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs' });
  }
  next();
};