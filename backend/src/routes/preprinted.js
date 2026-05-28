const express = require('express');
const PrePrintedQR = require('../models/PrePrintedQR');
const Bike = require('../models/Bike');
const authMiddleware = require('../middleware/auth');
const { gerarLote } = require('../utils/qrManager');
const router = express.Router();

// Listar QR codes (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total, disponiveis, vinculados] = await Promise.all([
      PrePrintedQR.find(query).sort({ stickerNumber: 1 }).skip(skip).limit(parseInt(limit)),
      PrePrintedQR.countDocuments(query),
      PrePrintedQR.countDocuments({ status: 'disponivel' }),
      PrePrintedQR.countDocuments({ status: 'vinculado' }),
    ]);

    res.json({ items, total, disponiveis, vinculados, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar.' });
  }
});

// Gerar lote manual (admin)
router.post('/gerar-lote', authMiddleware, async (req, res) => {
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
    res.status(500).json({ message: 'Erro ao buscar.' });
  }
});

// Buscar por stickerNumber (admin)
router.get('/buscar/:stickerNumber', authMiddleware, async (req, res) => {
  try {
    const qr = await PrePrintedQR.findOne({ stickerNumber: req.params.stickerNumber.toUpperCase() });
    if (!qr) return res.status(404).json({ message: 'QR nao encontrado.' });
    res.json(qr);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar.' });
  }
});

module.exports = router;
