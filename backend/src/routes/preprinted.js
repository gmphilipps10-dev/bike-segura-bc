const express = require('express');
const PrePrintedQR = require('../models/PrePrintedQR');
const Bike = require('../models/Bike');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// ===== GERADORES =====
function generateStickerNumber(prefixo, sequencia) {
  return `${prefixo}-${String(sequencia).padStart(4, '0')}`;
}

function generateHash(stickerNumber) {
  const crypto = require('crypto');
  const salt = process.env.QR_SALT || 'bikesegura-bc-2025-salt';
  return crypto.createHash('sha256')
    .update(stickerNumber + salt + Date.now() + Math.random())
    .digest('hex')
    .slice(0, 12);
}

// ===== FUNCAO PRIVADA: Gera lote de QR codes =====
async function gerarLoteInterno(quantidade = 100, prefixo = 'BSBC') {
  const ultimo = await PrePrintedQR.findOne({ stickerNumber: new RegExp(`^${prefixo}-`) })
    .sort({ stickerNumber: -1 })
    .select('stickerNumber');

  let sequencia = 1;
  if (ultimo) {
    const match = ultimo.stickerNumber.match(/-(\d+)$/);
    if (match) sequencia = parseInt(match[1]) + 1;
  }

  const docs = [];
  for (let i = 0; i < quantidade; i++) {
    const stickerNumber = generateStickerNumber(prefixo, sequencia + i);
    const hash = generateHash(stickerNumber);
    docs.push({ stickerNumber, hash, lote: 'auto', status: 'disponivel' });
  }

  await PrePrintedQR.insertMany(docs, { ordered: false }).catch(err => {
    if (err.code !== 11000) throw err;
  });

  console.log(`[Auto-Lote] ${quantidade} adesivos gerados: ${generateStickerNumber(prefixo, sequencia)} ate ${generateStickerNumber(prefixo, sequencia + quantidade - 1)}`);
  return docs;
}

// ===== FUNCAO UTILITARIA PUBLICA =====
// Busca o proximo QR disponivel e vincula a uma bike
async function vincularProximoQR(bikeId, userId) {
  let qr = await PrePrintedQR.findOneAndUpdate(
    { status: 'disponivel' },
    { status: 'vinculado', bikeId, userId, vinculadoAt: new Date() },
    { sort: { stickerNumber: 1 }, new: true }
  );

  // Se nao houver QR disponivel, gera lote automaticamente
  if (!qr) {
    console.log('[Auto-Lote] Estoque vazio. Gerando 100 novos adesivos...');
    await gerarLoteInterno(100, 'BSBC');
    // Tenta vincular novamente
    qr = await PrePrintedQR.findOneAndUpdate(
      { status: 'disponivel' },
      { status: 'vinculado', bikeId, userId, vinculadoAt: new Date() },
      { sort: { stickerNumber: 1 }, new: true }
    );
  }

  if (!qr) return null;
  await Bike.findByIdAndUpdate(bikeId, { hash: qr.hash });
  return qr;
}

// ===== ROTAS ADMIN (autenticadas) =====

// Listar QR codes (com filtros)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, lote, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (lote) query.lote = lote;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total, disponiveis, vinculados] = await Promise.all([
      PrePrintedQR.find(query).sort({ stickerNumber: 1 }).skip(skip).limit(parseInt(limit)),
      PrePrintedQR.countDocuments(query),
      PrePrintedQR.countDocuments({ status: 'disponivel' }),
      PrePrintedQR.countDocuments({ status: 'vinculado' }),
    ]);

    res.json({ items, total, disponiveis, vinculados, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('List preprinted error:', error);
    res.status(500).json({ message: 'Erro ao listar QR codes.' });
  }
});

// Gerar lote de QR codes pre-impressos (manual - admin)
router.post('/gerar-lote', authMiddleware, async (req, res) => {
  try {
    const { quantidade = 100, prefixo = 'BSBC' } = req.body;
    const qtd = Math.min(parseInt(quantidade), 1000);
    const docs = await gerarLoteInterno(qtd, prefixo);
    res.status(201).json({
      message: `${qtd} QR codes gerados`,
      prefixo,
      de: docs[0].stickerNumber,
      ate: docs[docs.length - 1].stickerNumber,
      quantidade: qtd,
    });
  } catch (error) {
    console.error('Gerar lote error:', error);
    res.status(500).json({ message: 'Erro ao gerar lote.' });
  }
});

// Verificar proximos disponiveis (para o tecnico saber quais levar)
router.get('/proximos-disponiveis', authMiddleware, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const disponiveis = await PrePrintedQR
      .find({ status: 'disponivel' })
      .sort({ stickerNumber: 1 })
      .limit(parseInt(limit))
      .select('stickerNumber hash lote');
    res.json({
      quantidade: disponiveis.length,
      proximos: disponiveis.map(d => d.stickerNumber),
      items: disponiveis,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar disponiveis.' });
  }
});

// Buscar QR por numero do adesivo
router.get('/buscar/:stickerNumber', authMiddleware, async (req, res) => {
  try {
    const qr = await PrePrintedQR.findOne({ stickerNumber: req.params.stickerNumber.toUpperCase() });
    if (!qr) return res.status(404).json({ message: 'QR nao encontrado.' });
    res.json(qr);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar QR.' });
  }
});

// ===== ROTAS PUBLICAS (sem auth) =====

// Consulta publica por hash
router.get('/public/:hash', async (req, res) => {
  try {
    const hash = req.params.hash.toLowerCase();

    const qr = await PrePrintedQR.findOne({ hash }).populate('bikeId');
    if (qr && qr.status === 'vinculado' && qr.bikeId) {
      const bike = qr.bikeId;
      qr.scanCount = (qr.scanCount || 0) + 1;
      qr.lastScanAt = new Date();
      await qr.save();

      const User = require('../models/User');
      const owner = await User.findById(bike.userId);

      return res.json({
        id: bike._id, hash: qr.hash, stickerNumber: qr.stickerNumber,
        name: bike.name, brand: bike.brand, type: bike.type,
        color: bike.color, serie: bike.serie, caracteristicas: bike.caracteristicas || '',
        photo: bike.photo, status: bike.status, protected: bike.protected,
        ownerName: owner ? owner.name.split(' ').map((n, i) => i === 0 ? n : n.charAt(0) + '.').join(' ') : 'Usuario',
        ownerPhone: owner ? owner.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-****') : '',
        ownerSince: bike.createdAt ? new Date(bike.createdAt).getFullYear().toString() : '2025',
        boRegistered: !!bike.boNumber, boNumber: bike.boNumber,
        alertDate: bike.alertDate ? new Date(bike.alertDate).toLocaleDateString('pt-BR') : null,
        lastSeen: bike.lastSeen, lastLocation: bike.location, scans: qr.scanCount,
      });
    }

    // Fallback direto na Bike
    const bike = await Bike.findOne({ hash });
    if (!bike) return res.status(404).json({ error: 'Registro nao encontrado' });

    bike.scanCount = (bike.scanCount || 0) + 1;
    bike.lastScanAt = new Date();
    await bike.save();

    const User = require('../models/User');
    const owner = await User.findById(bike.userId);
    res.json({
      id: bike._id, hash: bike.hash, name: bike.name, brand: bike.brand,
      type: bike.type, color: bike.color, serie: bike.serie,
      caracteristicas: bike.caracteristicas || '', photo: bike.photo,
      status: bike.status, protected: bike.protected,
      ownerName: owner ? owner.name.split(' ').map((n, i) => i === 0 ? n : n.charAt(0) + '.').join(' ') : 'Usuario',
      ownerPhone: owner ? owner.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-****') : '',
      ownerSince: bike.createdAt ? new Date(bike.createdAt).getFullYear().toString() : '2025',
      boRegistered: !!bike.boNumber, boNumber: bike.boNumber,
      alertDate: bike.alertDate ? new Date(bike.alertDate).toLocaleDateString('pt-BR') : null,
      lastSeen: bike.lastSeen, lastLocation: bike.location, scans: bike.scanCount || 0,
    });
  } catch (error) {
    console.error('Public QR error:', error);
    res.status(500).json({ error: 'Erro ao consultar' });
  }
});

// Avistamento
router.post('/public/:hash/scan', async (req, res) => {
  try {
    const hash = req.params.hash.toLowerCase();
    const qr = await PrePrintedQR.findOne({ hash });
    if (qr) {
      qr.scanCount = (qr.scanCount || 0) + 1;
      qr.lastScanAt = new Date();
      await qr.save();
    } else {
      await Bike.updateOne({ hash }, { $inc: { scanCount: 1 }, lastScanAt: new Date() });
    }
    res.json({ success: true, message: 'Aviso registrado. Proprietario sera notificado.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar' });
  }
});

module.exports = router;
module.exports.vincularProximoQR = vincularProximoQR;
