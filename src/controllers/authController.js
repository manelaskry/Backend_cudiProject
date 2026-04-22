const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper pour générer le token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper pour setter le cookie auth
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,                                   
    secure: process.env.NODE_ENV === 'production',    
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000                
  });
};

// Helper pour vérifier le token Google et récupérer les infos
const getGoogleUser = async (accessToken) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error('Token Google invalide');
  return response.json();
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role });
    const token = generateToken(user);

    setAuthCookie(res, token);
    res.status(201).json({
      user: { id: user._id, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Bloquer les comptes Google
    if (user.googleId && user.password === 'google_oauth') {
      return res.status(400).json({ message: 'Ce compte utilise la connexion Google' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);
    res.json({ user: { id: user._id, email: user.email, role: user.role } });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(401).json({ message: 'Non autorisé' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
  res.json({ message: 'Déconnecté' });
};

// GOOGLE AUTH — inscription + login fusionnés
exports.googleAuth = async (req, res) => {
  try {
    const { accessToken, role } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Token Google manquant' });
    }

    // ✅ Vérifie le token avec Google
    const { email, name, picture, sub: googleId } = await getGoogleUser(accessToken);

    let user = await User.findOne({ email });

    if (!user) {
      // Nouveau user → role obligatoire
      if (!role) {
        return res.status(400).json({ message: 'Rôle requis pour inscription' });
      }
      user = await User.create({
        email, name,
        avatar: picture,
        googleId,
        password: 'google_oauth',
        role
      });
    } else if (!user.googleId) {
      // Compte existant sans Google → lier
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      user.name = user.name || name;
      await user.save();
    }

    const token = generateToken(user);
    setAuthCookie(res, token);
    res.json({ user: { id: user._id, email: user.email, role: user.role } });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: error.message || 'Erreur Google auth' });
  }
};

// CHECK EMAIL — vérifie si un email existe (pour inscription normale)
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// CHECK EMAIL BY TOKEN — vérifie si un user Google existe déjà
exports.checkEmailByToken = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Token manquant' });

    const { email } = await getGoogleUser(accessToken);
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};