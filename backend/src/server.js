const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bikes', require('./routes/bikes'));
app.use('/api/preprinted', require('./routes/preprinted'));
app.use('/api/ocorrencias', require('./routes/ocorrencias'));

// Serve static files (logo, assets)
app.use(express.static(path.join(__dirname, '../public')));

// Serve painel administrativo em /paineladmin/
app.use('/paineladmin', express.static(path.join(__dirname, '../public/paineladmin')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERRO: MONGODB_URI nao definida!');
  console.error('Crie um arquivo .env com: MONGODB_URI=sua_connection_string');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Atlas conectado!');
    const PO