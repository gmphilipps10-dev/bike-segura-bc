const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token nao fornecido.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token especial do painel admin
    if (decoded.id === 'painel-admin' && decoded.isAdmin) {
      req.userId = 'painel-admin';
      req.isPainelAdmin = true;
      return next();
    }

    // Token normal de usuario
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado.' });

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalido.' });
  }
}

module.exports = authMiddleware;
