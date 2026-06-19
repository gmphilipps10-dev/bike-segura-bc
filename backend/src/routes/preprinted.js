const express = require('express');
const PrePrintedQR = require('../models/PrePrintedQR');
const Bike = require('../models/Bike');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { gerarLote } = require('../utils/qrManager');
const router = express.Router();

// Listar QR codes (admin)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 2000);
    const skip = (parsedPage - 1) * parsedLimit;
    const [items, total, disponiveis, vinculados, inativos] = await Promise.all([
      PrePrintedQR.find(query)
        .sort({ stickerNumber: 1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('bikeId', 'name brand type serie color')
        .populate('userId', 'name email'),
      PrePrintedQR.countDocuments(query),
      PrePrintedQR.countDocuments({ status: 'disponivel' }),
      PrePrintedQR.countDocuments({ status: 'vinculado' }),
      PrePrintedQR.countDocuments({ status: 'inativo' }),
    ]);

    res.json({
      items,
      total,
      disponiveis,
      vinculados,
      inativos,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar.' });
  }
});

// Gerar lote manual (admin)
router.post('/gerar-lote', adminMiddleware, async (req, res) => {
  try {
    const { quantidade = 100, prefixo = 'BSBC' } = req.body;
    const qtd = Math.min(parseInt(quantidade), 1000);
    const docs = await gerarLote(qtd, prefixo);
    res.status(201).json({
      message: `${qtd} QR codes gerados`,
      prefixo,
      de: docs[0].stickerNumber,
      ate: docs[docs.length - 1].stickerNumber,
      quantidade: qtd,
    });
  } catch (error) {
    console.error('[QR-GerarLote] Erro:', error);
    res.status(500).json({ message: 'Erro ao gerar lote.' });
  }
});

// Proximos disponiveis (admin)
router.get('/proximos-disponiveis', adminMiddleware, async (req, res) => {
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
    res.status(500).json({ message: 'Erro ao buscar.' });
  }
});

// Buscar por stickerNumber (admin)
router.get('/buscar/:stickerNumber', adminMiddleware, async (req, res) => {
  try {
    const qr = await PrePrintedQR
      .findOne({ stickerNumber: req.params.stickerNumber.toUpperCase() })
      .populate('bikeId', 'name brand type serie color')
      .populate('userId', 'name email');
    if (!qr) return res.status(404).json({ message: 'QR nao encontrado.' });
    res.json(qr);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar.' });
  }
});

// Rota publica para consultar adesivo pelo stickerNumber (para QR Code)
router.get('/sticker/:stickerNumber', async (req, res) => {
  try {
    const qr = await PrePrintedQR.findOne({
      stickerNumber: req.params.stickerNumber.toUpperCase()
    });
    if (!qr) return res.status(404).json({ error: 'Adesivo nao encontrado' });
    res.json({ hash: qr.hash, stickerNumber: qr.stickerNumber, status: qr.status });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar adesivo' });
  }
});

module.exports = router;
