const express = require('express');
const PrePrintedQR = require('../models/PrePrintedQR');
const Bike = require('../models/Bike');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { gerarLote } = require('../utils/qrManager');
const router = express.Router();

function emptyStickerLink() {
  return {
    bikeId: null,
    userId: null,
    vinculadoAt: null,
    ultimoVinculo: {
      bikeId: null,
      userId: null,
      equipamentoNome: '',
      equipamentoMarca: '',
      equipamentoTipo: '',
      equipamentoSerie: '',
      equipamentoCor: '',
      proprietarioNome: '',
      vinculadoAt: null,
      inativadoAt: null,
      motivo: '',
    },
    scanCount: 0,
    lastScanAt: null,
  };
}

async function liberarAdesivos(query) {
  const adesivos = await PrePrintedQR
    .find(query)
    .select('_id hash bikeId status')
    .lean();

  if (adesivos.length === 0) {
    return { total: 0, adesivosLiberados: 0, equipamentosAtualizados: 0 };
  }

  const ids = adesivos.map(item => item._id);
  const hashes = [...new Set(adesivos.map(item => item.hash).filter(Boolean))];
  const bikeIds = [...new Set(adesivos.map(item => item.bikeId).filter(Boolean).map(String))];
  const bikeFilters = [];
  if (hashes.length) bikeFilters.push({ hash: { $in: hashes } });
  if (bikeIds.length) bikeFilters.push({ _id: { $in: bikeIds } });

  const [bikes, qrs] = await Promise.all([
    bikeFilters.length
      ? Bike.updateMany({ $or: bikeFilters }, { $unset: { hash: '' } })
      : Promise.resolve({ modifiedCount: 0 }),
    PrePrintedQR.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: 'disponivel',
          ...emptyStickerLink(),
        },
      }
    ),
  ]);

  return {
    total: adesivos.length,
    adesivosLiberados: qrs.modifiedCount || 0,
    equipamentosAtualizados: bikes.modifiedCount || 0,
  };
}

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

// Liberar todos os adesivos que aparecem como em uso ou inativos (admin)
router.post('/liberar-vinculos', adminMiddleware, async (_req, res) => {
  try {
    const result = await liberarAdesivos({ status: { $in: ['vinculado', 'inativo'] } });
    res.json({
      success: true,
      message: `${result.adesivosLiberados} adesivos liberados.`,
      adesivos_liberados: result.adesivosLiberados,
      equipamentos_atualizados: result.equipamentosAtualizados,
    });
  } catch (error) {
    console.error('[QR-LiberarVinculos] Erro:', error);
    res.status(500).json({ message: 'Erro ao liberar adesivos.' });
  }
});

// Liberar um adesivo especifico (admin)
router.post('/:id/liberar', adminMiddleware, async (req, res) => {
  try {
    if (!req.params.id.match(/^[a-f0-9]{24}$/i)) {
      return res.status(400).json({ message: 'Adesivo invalido.' });
    }

    const result = await liberarAdesivos({ _id: req.params.id });
    if (result.total === 0) return res.status(404).json({ message: 'Adesivo nao encontrado.' });

    res.json({
      success: true,
      message: 'Adesivo liberado.',
      adesivos_liberados: result.adesivosLiberados,
      equipamentos_atualizados: result.equipamentosAtualizados,
    });
  } catch (error) {
    console.error('[QR-LiberarAdesivo] Erro:', error);
    res.status(500).json({ message: 'Erro ao liberar adesivo.' });
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
