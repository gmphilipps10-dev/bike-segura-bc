const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

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
    const updates = req.body;
    delete updates.password; // Don't allow password update here

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
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil.' });
  }
});

// Listar todos os usuarios (admin)
router.get('/users', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token nao fornecido.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Verifica se usuario existe
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado.' });

    // Retorna todos os usuarios sem a senha
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('[Admin-Users] Erro:', error);
    res.status(500).json({ message: 'Erro ao listar usuarios.' });
  }
});

module.exports = router;
