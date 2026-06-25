const jwt = require('jsonwebtoken');
const User = require('../models/User');

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function ownerEmails() {
  const configurado = process.env.OWNER_EMAILS || process.env.OWNER_EMAIL || '';
  return configurado
    .split(',')
    .map(email => normalizarEmail(email))
    .filter(Boolean);
}

function isOwnerEmail(email) {
  return ownerEmails().includes(normalizarEmail(email));
}

async function garantirProprietario(user) {
  if (!user || !isOwnerEmail(user.email)) return false;
  if (!user.isOwner || !user.isAdmin) {
    await User.updateOne(
      { _id: user._id },
      { $set: { isOwner: true, isAdmin: true } }
    );
    user.isOwner = true;
    user.isAdmin = true;
  }
  return true;
}

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
    const isOwner = Boolean(user.isOwner || isOwnerEmail(user.email));
    if (isOwner) await garantirProprietario(user);

    req.userId = user._id;
    req.user = user;
    req.isOwner = isOwner;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalido.' });
  }
}

module.exports = authMiddleware;
