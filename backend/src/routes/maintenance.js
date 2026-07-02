const express = require('express');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const Bike = require('../models/Bike');
const Pagamento = require('../models/Pagamento');
const PrePrintedQR = require('../models/PrePrintedQR');
const Sinistro = require('../models/Sinistro');
const Ocorrencia = require('../models/Ocorrencia');
const ProtectionSession = require('../models/ProtectionSession');
const ProtectionEvent = require('../models/ProtectionEvent');
const PushSubscription = require('../models/PushSubscription');
const AppAnalytics = require('../models/AppAnalytics');
const PartnerSale = require('../models/PartnerSale');
const Installation = require('../models/Installation');
const InstallationInventory = require('../models/InstallationInventory');

const router = express.Router();
const RESET_CONFIRMATION = 'ZERAR BIKE SEGURA BC';

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function ownerEmails() {
  return String(process.env.OWNER_EMAILS || process.env.OWNER_EMAIL || '')
    .split(',')
    .map(normalizarEmail)
    .filter(Boolean);
}

function nonAdminUsersQuery() {
  const owners = ownerEmails();
  const query = {
    isAdmin: { $ne: true },
    isOwner: { $ne: true },
  };
  if (owners.length) query.email = { $nin: owners };
  return query;
}

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

async function ensureInventoryDefaults(updatedBy) {
  const defaults = [
    { item: 'tag', label: 'TAG Bike Segura', current_quantity: 0, minimum_quantity: 0 },
    { item: 'gps', label: 'Rastreador GPS 4G', current_quantity: 3, minimum_quantity: 1 },
    { item: 'adhesive', label: 'Adesivos QR', current_quantity: 200, minimum_quantity: 20 },
  ];

  const results = {};
  for (const item of defaults) {
    const result = await InstallationInventory.findOneAndUpdate(
      { item: item.item },
      {
        $set: {
          label: item.label,
          current_quantity: item.current_quantity,
          minimum_quantity: item.minimum_quantity,
          reserved_quantity: 0,
          updated_by: updatedBy,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );
    results[item.item] = {
      current_quantity: result.current_quantity,
      reserved_quantity: result.reserved_quantity,
    };
  }
  return results;
}

async function buildPreview() {
  const [
    clientesComuns,
    adminsPreservados,
    equipamentos,
    pagamentos,
    adesivosTotal,
    adesivosVinculados,
    adesivosInativos,
    sinistros,
    ocorrencias,
    sessoesProtecao,
    eventosProtecao,
    pushSubscriptions,
    analytics,
    vendasParceiras,
    instalacoes,
    inventarioInstalacao,
  ] = await Promise.all([
    User.countDocuments(nonAdminUsersQuery()),
    User.countDocuments({
      $or: [
        { isAdmin: true },
        { isOwner: true },
        ...(ownerEmails().length ? [{ email: { $in: ownerEmails() } }] : []),
      ],
    }),
    Bike.countDocuments(),
    Pagamento.countDocuments(),
    PrePrintedQR.countDocuments(),
    PrePrintedQR.countDocuments({ status: 'vinculado' }),
    PrePrintedQR.countDocuments({ status: 'inativo' }),
    Sinistro.countDocuments(),
    Ocorrencia.countDocuments(),
    ProtectionSession.countDocuments(),
    ProtectionEvent.countDocuments(),
    PushSubscription.countDocuments(),
    AppAnalytics.countDocuments(),
    PartnerSale.countDocuments(),
    Installation.countDocuments(),
    InstallationInventory.find().lean(),
  ]);

  return {
    confirmationPhrase: RESET_CONFIRMATION,
    remove: {
      clientesComuns,
      equipamentos,
      pagamentos,
      sinistros,
      ocorrencias,
      sessoesProtecao,
      eventosProtecao,
      pushSubscriptions,
      analytics,
      vendasParceiras,
      instalacoes,
    },
    reset: {
      adesivosTotal,
      adesivosVinculados,
      adesivosInativos,
      inventarioInstalacao: inventarioInstalacao.map(item => ({
        item: item.item,
        label: item.label,
        current_quantity: item.current_quantity,
        reserved_quantity: item.reserved_quantity,
      })),
    },
    preserve: {
      adminsPreservados,
      planos: true,
      lojasParceiras: true,
    },
  };
}

router.use(adminMiddleware);

router.get('/reset-preview', async (_req, res) => {
  try {
    res.json(await buildPreview());
  } catch (error) {
    console.error('[Maintenance] Erro preview reset:', error);
    res.status(500).json({ message: 'Erro ao carregar previa da limpeza.' });
  }
});

router.post('/reset-operational-data', async (req, res) => {
  try {
    const confirmation = String(req.body?.confirmation || '').trim().toUpperCase();
    if (confirmation !== RESET_CONFIRMATION) {
      return res.status(400).json({ message: `Digite exatamente: ${RESET_CONFIRMATION}` });
    }

    const before = await buildPreview();
    const updatedBy = req.user?.email || req.user?.name || (req.isPainelAdmin ? 'Painel Admin' : 'Admin');

    const [
      eventosProtecao,
      sessoesProtecao,
      pushSubscriptions,
      analytics,
      vendasParceiras,
      instalacoes,
      pagamentos,
      sinistros,
      ocorrencias,
      equipamentos,
      clientesComuns,
    ] = await Promise.all([
      ProtectionEvent.deleteMany({}),
      ProtectionSession.deleteMany({}),
      PushSubscription.deleteMany({}),
      AppAnalytics.deleteMany({}),
      PartnerSale.deleteMany({}),
      Installation.deleteMany({}),
      Pagamento.deleteMany({}),
      Sinistro.deleteMany({}),
      Ocorrencia.deleteMany({}),
      Bike.deleteMany({}),
      User.deleteMany(nonAdminUsersQuery()),
    ]);

    const adesivos = await PrePrintedQR.updateMany(
      {},
      {
        $set: {
          status: 'disponivel',
          ...emptyStickerLink(),
        },
      }
    );

    const inventario = await ensureInventoryDefaults(updatedBy);
    const after = await buildPreview();

    res.json({
      success: true,
      message: 'Base operacional zerada com sucesso.',
      before,
      deleted: {
        clientesComuns: clientesComuns.deletedCount || 0,
        equipamentos: equipamentos.deletedCount || 0,
        pagamentos: pagamentos.deletedCount || 0,
        sinistros: sinistros.deletedCount || 0,
        ocorrencias: ocorrencias.deletedCount || 0,
        sessoesProtecao: sessoesProtecao.deletedCount || 0,
        eventosProtecao: eventosProtecao.deletedCount || 0,
        pushSubscriptions: pushSubscriptions.deletedCount || 0,
        analytics: analytics.deletedCount || 0,
        vendasParceiras: vendasParceiras.deletedCount || 0,
        instalacoes: instalacoes.deletedCount || 0,
      },
      reset: {
        adesivos: adesivos.modifiedCount || 0,
        inventario,
      },
      after,
    });
  } catch (error) {
    console.error('[Maintenance] Erro reset operacional:', error);
    res.status(500).json({ message: 'Erro ao executar limpeza da base operacional.' });
  }
});

module.exports = router;
