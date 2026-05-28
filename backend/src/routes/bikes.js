const express = require('express');
const Bike = require('../models/Bike');
const authMiddleware = require('../middleware/auth');
const { vincularProximoQR, generateHash } = require('../utils/qrManager');
const router = express.Router();

// Consulta publica de bike por hash (QR Code) - SEM AUTENTICACAO
router.get('/public/:hash', async (req, res) => {
  try {
    const bike = await Bike.findOne({ hash: req.params.hash.toLowerCase() });
    if (!bike) return res.status(404).json({ error: 'Registro nao encontrado' });

    const User = require('../models/User');
    const owner = await User.findById(bike.userId);

    bike.scanCount = (bike.scanCount || 0) + 1;
    bike.lastScanAt = new Date();
    await bike.save();

    res.json({
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
      ownerPhone: owner ? owner.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-****') : '',
      ownerSince: bike.createdAt ? new Date(bike.createdAt).getFullYear().toString() : '2025',
      boRegistered: !!bike.boNumber,
      boNumber: bike.boNumber,
      alertDate: bike.alertDate ? new Date(bike.alertDate).toLocaleDateString('pt-BR') : null,
      lastSeen: bike.lastSeen,
      lastLocation: bike.location,
      scans: bike.scanCount,
    });
  } catch (error) {
    console.error('[QR-Public] Erro:', error);
    res.status(500).json({ error: 'Erro ao consultar registro' });
  }
});

// Registrar avistamento - SEM AUTENTICACAO
router.post('/public/:hash/scan', async (req, res) => {
  try {
    const hash = req.params.hash.toLowerCase();
    const bike = await Bike.findOne({ hash });
    if (bike) {
      bike.scanCount = (bike.scanCount || 0) + 1;
      bike.lastScanAt = new Date();
      await bike.save();
    }
    res.json({ success: true, message: 'Aviso registrado.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar' });
  }
});

// ===== A PARTIR DAQUI TUDO REQUER AUTENTICACAO =====
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

// Criar bike - COM GERACAO DE HASH AUTOMATICA
router.post('/', async (req, res) => {
  try {
    const { name, type, brand, serie, color, value, photo, rastreamento, plataformaTag, caracteristicas } = req.body;

    if (!name || !brand || !serie || !color) {
      return res.status(400).json({ message: 'Preencha os campos obrigatorios.' });
    }

    // Cria a bike
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
    });
    await bike.save();
    console.log('[Bike-Criar] Bike salva ID:', bike._id);

    // Vincula QR (auto-gera se necessario)
    const { hash, stickerNumber } = await vincularProximoQR(bike._id, req.userId);
    console.log('[Bike-Criar] QR vinculado:', { hash, stickerNumber });

    // Se nao conseguiu vincular, gera hash fallback
    if (!hash) {
      bike.hash = generateHash(serie);
      await bike.save();
      console.log('[Bike-Criar] Hash fallback gerado:', bike.hash);
    }

    // Recarrega com hash atualizado
    const bikeAtualizada = await Bike.findById(bike._id).lean();

    const response = {
      ...bikeAtualizada,
      id: bikeAtualizada._id.toString(),
      hash: bikeAtualizada.hash,
      stickerNumber: stickerNumber || null,
    };

    console.log('[Bike-Criar] Resposta enviada:', { id: response.id, hash: response.hash, stickerNumber: response.stickerNumber });
    res.status(201).json(response);
  } catch (error) {
    console.error('[Bike-Criar] ERRO:', error);
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
    res.status(500).json({ message: 'Erro ao ativar alerta.' });
  }
});

// Deletar bike
router.delete('/:id', async (req, res) => {
  try {
    const bike = await Bike.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!bike) return res.status(404).json({ message: 'Bike nao encontrada.' });
    res.json({ message: 'Bike removida.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover bike.' });
  }
});

module.exports = router;
