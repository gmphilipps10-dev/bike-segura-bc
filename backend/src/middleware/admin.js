const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware: verifica se usuario e admin
async function adminMiddleware(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Acesso negado. Token nao fornecido.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado.' });
    if (!user.isAdmin) return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalido.' });
  }
}

module.exports = adminMiddleware;
