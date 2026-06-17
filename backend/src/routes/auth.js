const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const adminMiddleware = require('../middleware/admin');
const router = express.Router();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} nao configurada`);
  return value;
}

function pickAllowed(source, allowedFields) {
  return allowedFields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) acc[field] = source[field];
    return acc;
  }, {});
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatorios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres.' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email ja esta cadastrado.' });
    }

    // Create user
    const user = new User({ name, email, phone, password });
    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        rg: user.rg,
        nascimento: user.nascimento,
        endereco: user.endereco,
        contatoEmergencia: user.contatoEmergencia,
        plano: user.plano,
        planoAtivo: user.planoAtivo,
        isAdmin: user.isAdmin,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Erro ao criar conta.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Preencha email e senha.' });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email }, { phone: email }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Email ou senha incorretos.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou senha incorretos.' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        rg: user.rg,
        nascimento: user.nascimento,
        endereco: user.endereco,
        contatoEmergencia: user.contatoEmergencia,
        plano: user.plano,
        planoAtivo: user.planoAtivo,
        isAdmin: user.isAdmin,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
});

// Get profile
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token nao fornecido.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado.' });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      cpf: user.cpf,
      rg: user.rg,
      nascimento: user.nascimento,
      endereco: user.endereco,
      contatoEmergencia: user.contatoEmergencia,
      plano: user.plano,
      planoAtivo: user.planoAtivo,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(401).json({ message: 'Token invalido.' });
  }
});

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token nao fornecido.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const updates = pickAllowed(req.body, [
      'name',
      'email',
      'phone',
      'cpf',
      'rg',
      'nascimento',
      'endereco',
      'contatoEmergencia',
    ]);

    const user = await User.findByIdAndUpdate(decoded.id, updates, { new: true }).select('-password');
    
    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado.' });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      cpf: user.cpf,
      rg: user.rg,
      nascimento: user.nascimento,
      endereco: user.endereco,
      contatoEmergencia: user.contatoEmergencia,
      plano: user.plano,
      planoAtivo: user.planoAtivo,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil.' });
  }
});

// Virar administrador (com PIN de seguranca)
router.post('/become-admin', async (req, res) => {
  try {
    if (process.env.ENABLE_ADMIN_PROMOTION !== 'true') {
      return res.status(404).json({ message: 'Rota nao disponivel.' });
    }

    const { pin } = req.body;
    const pinCorreto = requireEnv('ADMIN_PIN');
    
    if (pin !== pinCorreto) {
      return res.status(403).json({ message: 'PIN incorreto.' });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token nao fornecido.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { isAdmin: true },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado.' });

    res.json({
      message: 'Agora voce e administrador!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        rg: user.rg,
        nascimento: user.nascimento,
        endereco: user.endereco,
        contatoEmergencia: user.contatoEmergencia,
        plano: user.plano,
        planoAtivo: user.planoAtivo,
        isAdmin: user.isAdmin,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro.' });
  }
});

// Login do painel administrativo (senha exclusiva)
router.post('/painel-login', async (req, res) => {
  try {
    const { senha } = req.body;
    const senhaCorreta = requireEnv('PAINEL_SENHA');

    if (senha !== senhaCorreta) {
      return res.status(403).json({ message: 'Senha incorreta.' });
    }

    // Gera token JWT especial para o painel
    const token = jwt.sign(
      { id: 'painel-admin', isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, message: 'Login efetuado com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
});

// Listar todos os usuarios (admin)
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar usuarios.' });
  }
});

module.exports = router;
