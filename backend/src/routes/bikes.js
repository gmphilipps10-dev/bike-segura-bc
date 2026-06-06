const express = require('express');
const Bike = require('../models/Bike');
const authMiddleware = require('../middleware/auth');
const { vincularProximoQR, generateHash } = require('../utils/qrManager');
const { notificarFurto } = require('./push');
const router = express.Router();

// Consulta publica - SEM AUTH
router.get('/public/:hash', async (req, res) => {
  try {
    const bike = await Bike.findOne({ hash: req.params.hash.toLowerCase() });
    if (!bike) return res.status(404).json({ error: 'Registro nao encontrado' });

    const User = require('../models/User');
    const owner = await User.findById(bike.userId);

    bike.scanCount = (bike.scanCount || 0) + 1;
    bike.lastScanAt = new Date();
    await bike.save();

    // LGPD: quando furtado, mostra dados mais completos (interesse legitimo art. 7, VII)
    const isFurtada = bike.status === 'furto';
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
      ownerName: owner ? (isFurtada ? owner.name : owner.name.split(' ').map((n, i) => i === 0 ? n : n.charAt(0) + '.').join(' ')) : 'Usuario',
      ownerPhone: owner ? (isFurtada ? owner.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : owner.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-****')) : '',
      ownerEmail: isFurtada && owner ? owner.email : '',
      ownerSince: bike.createdAt ? new Date(bike.createdAt).getFullYear().toString() : '2025',
      boRegistered: !!bike.boNumber,
      boNumber: bike.boNumber,
      alertDate: bike.alertDate ? new Date(bike.alertDate).toLocaleDateString('pt-BR') : null,
      lastSeen: bike.lastSeen,
      lastLocation: bike.location,
      scans: bike.scanCount,
    });
  } catch (error) {
    console.error('[Public] Erro:', error);
    res.status(500).json({ error: 'Erro ao consultar' });
  }
});

// Avistamento - SEM AUTH
router.post('/public/:hash/scan', async (req, res) => {
  try {
    await Bike.updateOne(
      { hash: req.params.hash.toLowerCase() },
      { $inc: { scanCount: 1 }, lastScanAt: new Date() }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// ===== AUTH REQUIRED =====
router.use(authMiddleware);

// Listar bikes do usuario logado
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find({ userId: req.userId });
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Erro' });
  }
});

// Listar TODAS as bikes (admin ou painel)
router.get('/all', async (req, res) => {
  try {
    const bikes = await Bike.find().sort({ createdAt: -1 });
    res.json(bikes);
  } catch (error) {
    console.error('[Admin-Bikes] Erro:', error);
    res.status(500).json({ message: 'Erro ao listar equipamentos.' });
  }
});

// CRIAR BIKE - com QR Code
router.post('/', async (req, res) => {
  try {
    const { name, type, brand, serie, color, value, photo, rastreamento, plataformaTag, caracteristicas } = req.body;

    if (!name || !brand || !serie || !color) {
      return res.status(400).json({ message: 'Preencha marca, modelo, cor e numero de serie.' });
    }

    // === VALIDACAO DE RASTREAMENTO POR PLANO ===
    const user = req.user;
    let rastreioFinal = rastreamento || '';
    let plataformaFinal = plataformaTag || '';

    if (rastreioFinal && user) {
      const plano = user.plano;
      // Bronze: sem rastreamento
      if (plano === 'bronze') {
        rastreioFinal = '';
        plataformaFinal = '';
      }
      // Prata: apenas TAG
      if (plano === 'prata' && rastreioFinal === 'Rastreador GPS') {
        rastreioFinal = '';
        plataformaFinal = '';
      }
      // Prata: apenas TAG
      if (plano === 'prata' && rastreioFinal === 'TAG + GPS (Completo)') {
        rastreioFinal = 'TAG';
      }
      // Ouro: apenas GPS
      if (plano === 'ouro' && rastreioFinal === 'TAG') {
        rastreioFinal = '';
        plataformaFinal = '';
      }
      // Ouro: apenas GPS
      if (plano === 'ouro' && rastreioFinal === 'TAG + GPS (Completo)') {
        rastreioFinal = 'Rastreador GPS';
        plataformaFinal = '';
      }
    }

    // 1. Cria a bike
    const bike = new Bike({
      userId: req.userId,
      name,
      type: type || 'Nao informado',
      brand,
      serie,
      color,
      value: value || '',
      photo: photo || null,
      rastreamento: rastreioFinal,
      plataformaTag: plataformaFinal,
      caracteristicas: caracteristicas || '',
    });
    await bike.save();

    // 2. Tenta vincular QR pre-impresso
    const { hash, stickerNumber } = await vincularProximoQR(bike._id, req.userId);

    // 3. Se conseguiu, usa o hash do QR. Se nao, gera hash proprio
    let finalHash = hash;
    let finalSticker = stickerNumber;

    if (!finalHash) {
      finalHash = generateHash(serie);
      bike.hash = finalHash;
      await bike.save();
    }

    // 4. MONTA RESPOSTA MANUALMENTE - garante que todos os campos vem
    const response = {
      id: bike._id.toString(),
      _id: bike._id.toString(),
      name: bike.name,
      type: bike.type,
      brand: bike.brand,
      serie: bike.serie,
      color: bike.color,
      value: bike.value,
      photo: bike.photo,
      hash: finalHash,
      stickerNumber: finalSticker,
      status: bike.status,
      protected: bike.protected,
      location: bike.location,
      lastSeen: bike.lastSeen,
      rastreamento: bike.rastreamento,
      plataformaTag: bike.plataformaTag,
      caracteristicas: bike.caracteristicas,
      createdAt: bike.createdAt,
      updatedAt: bike.updatedAt,
      plano: user?.plano || 'free',
      planoAtivo: user?.planoAtivo || false,
      rastreioAjustado: (rastreamento || '') !== bike.rastreamento, // true se o backend ajustou o rastreamento
    };

    console.log('[Bike-Criar] OK hash=' + finalHash + ' sticker=' + finalSticker);
    res.status(201).json(response);

  } catch (error) {
    console.error('[Bike-Criar] ERRO:', error.message);
    res.status(500).json({ message: 'Erro ao cadastrar: ' + error.message });
  }
});

// Atualizar
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
    res.status(500).json({ message: 'Erro ao atualizar.' });
  }
});

// Furto
router.post('/:id/furto', async (req, res) => {
  try {
    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'furto', alertDate: new Date() },
      { new: true }
    );
    if (!bike) return res.status(404).json({ message: 'Bike nao encontrada.' });

    // Envia notificacao push para a comunidade
    try {
      await notificarFurto(bike, req.userId);
    } catch (pushErr) {
      console.error('[Bike-Furto] Erro ao enviar push:', pushErr.message);
      // Nao falha o request principal se o push falhar
    }

    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: 'Erro.' });
  }
});

// Deletar
router.delete('/:id', async (req, res) => {
  try {
    await Bike.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Removida.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro.' });
  }
});

module.exports = router;
