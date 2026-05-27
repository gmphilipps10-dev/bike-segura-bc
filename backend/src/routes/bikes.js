const express = require('express');
const Bike = require('../models/Bike');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// ===== FUNCOES UTILITARIAS =====

function generateHash(serie) {
  const crypto = require('crypto');
  const salt = process.env.QR_SALT || 'bikesegura-bc-2025-salt';
  return crypto.createHash('sha256')
    .update(serie + salt + Date.now())
    .digest('hex')
    .slice(0, 12);
}

// ===== ROTAS PUBLICAS (sem autenticacao) =====

// Consulta publica de bike por hash (QR Code)
router.get('/public/:hash', async (req, res) => {
  try {
    const bike = await Bike.findOne({ hash: req.params.hash.toLowerCase() });
    if (!bike) return res.status(404).json({ error: 'Registro nao encontrado' });

    // Buscar dados do proprietario
    const User = require('../models/User');
    const owner = await User.findById(bike.userId);

    // Incrementar contador de scans
    bike.scanCount = (bike.scanCount || 0) + 1;
    bike.lastScanAt = new Date();
    await bike.save();

    // Dados publicos (sem expor informacoes sensiveis)
    const publicData = {
      id: bike._id,
      hash: bike.hash,
      name: bike.name,
      brand: bike.brand,
      type: bike.type,
      color: bike.color,
      serie: bike.serie,
      caracteristicas: bike.caracteristicas || '',
      photo: bike.photo,
      status: bike.status,
      protected: bike.protected,
      ownerName: owner ? owner.name.split(' ').map((n, i) => i === 0 ? n : n.charAt(0) + '.').join(' ') : 'Usuario',
      ownerPhone: owner ? owner.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-****') : '',
      ownerSince: bike.createdAt ? new Date(bike.createdAt).getFullYear().toString() : '2025',
      boRegistered: !!bike.boNumber,
      boNumber: bike.boNumber,
      alertDate: bike.alertDate ? bike.alertDate.toLocaleDateString('pt-BR') : null,
      lastSeen: bike.lastSeen,
      lastLocation: bike.location,
      scans: bike.scanCount,
    };

    res.json(publicData);
  } catch (error) {
    console.error('Public bike query error:', error);
    res.status(500).json({ error: 'Erro ao consultar registro' });
  }
});

// Registrar avistamento (scan) de bike
router.post('/public/:hash/scan', async (req, res) => {
  try {
    const bike = await Bike.findOne({ hash: req.params.hash.toLowerCase() });
    if (!bike) return res.status(404).json({ error: 'Registro nao encontrado' });

    const { local, obs } = req.body;

    // TODO: aqui enviar notificacao ao proprietario (push, email, whatsapp)
    // Por enquanto, apenas registra

    res.json({ 
      success: true, 
      message: 'Aviso registrado. O proprietario sera notificado.' 
    });
  } catch (error) {
    console.error('Scan report error:', error);
    res.status(500).json({ error: 'Erro ao registrar aviso' });
  }
});

// ===== ROTAS AUTENTICADAS =====
router.use(authMiddleware);

// Listar bikes do usuario
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find({ userId: req.userId });
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar bikes.' });
  }
});

// Criar bike (com geracao de hash automatica)
router.post('/', async (req, res) => {
  try {
    const { name, type, brand, serie, color, value, photo, rastreamento, plataformaTag, caracteristicas } = req.body;

    if (!name || !brand || !serie || !color) {
      return res.status(400).json({ message: 'Preencha os campos obrigatorios.' });
    }

    const bike = new Bike({
      userId: req.userId,
      name,
      type: type || 'Nao informado',
      brand,
      serie,
      color,
      value: value || '',
      photo: photo || null,
      rastreamento: rastreamento || '',
      plataformaTag: plataformaTag || '',
      caracteristicas: caracteristicas || '',
      hash: generateHash(serie),
    });

    await bike.save();
    res.status(201).json(bike);
  } catch (error) {
    console.error('Create bike error:', error);
    res.status(500).json({ message: 'Erro ao cadastrar bike.' });
  }
});

// Atualizar bike
router.put('/:id', async (req, res) => {
  try {
    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!bike) return res.status(404).json({ message: 'Bike nao encontrada.' });
    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar bike.' });
  }
});

// Ativar alerta de furto
router.post('/:id/furto', async (req, res) => {
  try {
    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'furto', alertDate: new Date() },
      { new: true }
    );
    if (!bike) return res.status(404).json({ message: 'Bike nao encontrada.' });
    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao ativar alerta de furto.' });
  }
});

// Deletar bike
router.delete('/:id', async (req, res) => {
  try {
    const bike = await Bike.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!bike) return res.status(404).json({ message: 'Bike nao encontrada.' });
    res.json({ message: 'Bike removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover bike.' });
  }
});

module.exports = router;
