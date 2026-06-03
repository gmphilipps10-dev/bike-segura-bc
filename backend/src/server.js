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
app.use('/api/pagamentos', require('./routes/pagamentos'));

// Serve static files
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Serve painel administrativo
app.use('/paineladmin', express.static(path.join(publicPath, 'paineladmin')));
// Fallback para SPA do painel admin
app.get('/paineladmin/*', (req, res) => {
  res.sendFile(path.join(publicPath, 'paineladmin', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERRO: MONGODB_URI nao definida!');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Atlas conectado!');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar MongoDB:', err.message);
    process.exit(1);
  });
