const jwt = require('jsonwebtoken');
const InstitutionalUser = require('../models/InstitutionalUser');

async function institutionalAuth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token institucional nao fornecido.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.scope !== 'institutional' || !decoded.institutionalUserId) {
      return res.status(401).json({ message: 'Token institucional invalido.' });
    }

    const user = await InstitutionalUser.findById(decoded.institutionalUserId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ message: 'Usuario institucional inativo ou inexistente.' });
    }

    req.institutionalUser = user;
    req.institutionalRole = user.role;
    req.institutionalInstitution = user.institution;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token institucional invalido.' });
  }
}

function requireInstitutionalAdmin(req, res, next) {
  if (req.institutionalRole !== 'admin_bike_segura') {
    return res.status(403).json({ message: 'Acesso permitido apenas ao admin Bike Segura.' });
  }
  next();
}

module.exports = {
  institutionalAuth,
  requireInstitutionalAdmin,
};
