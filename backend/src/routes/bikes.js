const express = require('express');
const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const PrePrintedQR = require('../models/PrePrintedQR');
const Pagamento = require('../models/Pagamento');
const ProtectionSession = require('../models/ProtectionSession');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { vincularProximoQR, generateHash } = require('../utils/qrManager');
const { cancelarCobrancaAsaas } = require('../utils/asaas');
const { notificarFurto } = require('./push');
const router = express.Router();

function pickAllowed(source, allowedFields) {
  return allowedFields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) acc[field] = source[field];
    return acc;
  }, {});
}

async function sincronizarPlanoUsuario(userId) {
  const User = require('../models/User');
  const ordem = ['free', 'bronze', 'prata', 'ouro', 'diamante'];
  const ativas = await Bike.find({
    userId,
    planoAtivo: true,
    $or: [{ planoDataExpiracao: null }, { planoDataExpiracao: { $gt: new Date() } }],
  }).select('plano planoDataAtivacao planoDataExpiracao');

  if (!ativas.length) {
    await User.findByIdAndUpdate(userId, {
      plano: 'free',
      planoAtivo: false,
      planoDataAtivacao: null,
      planoDataExpiracao: null,
    });
    return;
  }

  const plano = ativas.reduce((melhor, bike) => (
    ordem.indexOf(bike.plano) > ordem.indexOf(melhor) ? bike.plano : melhor
  ), 'free');
  const expiracoes = ativas.map(bike => bike.planoDataExpiracao).filter(Boolean);
  await User.findByIdAndUpdate(userId, {
    plano,
    planoAtivo: true,
    planoDataExpiracao: expiracoes.length ? new Date(Math.max(...expiracoes.map(Number))) : null,
  });
}

function serializeProtectionSession(session) {
  if (!session) return null;
  return {
    id: String(session._id || session.id),
    active: Boolean(session.active),
    radius_meters: session.radius_meters,
    initial_latitude: session.initial_latitude,
    initial_longitude: session.initial_longitude,
    activated_at: session.activated_at,
    deactivated_at: session.deactivated_at,
    last_checked_at: session.last_checked_at,
    outside_detected_at: session.outside_detected_at,
    alert_triggered: Boolean(session.alert_triggered),
    alert_triggered_at: session.alert_triggered_at,
    last_distance_meters: session.last_distance_meters,
    updated_at: session.updated_at,
  };
}

async function anexarStatusProtecao(bikes) {
  const plainBikes = bikes.map(bike => (
    typeof bike.toObject === 'function'
      ? bike.toObject({ virtuals: true })
      : { ...bike }
  ));
  const ids = plainBikes.map(bike => bike._id || bike.id).filter(Boolean);

  if (!ids.length) return plainBikes;

  const sessions = await ProtectionSession
    .find({ equipment_id: { $in: ids } })
    .sort({ active: -1, updated_at: -1, activated_at: -1 })
    .lean();

  const latestByEquipment = new Map();
  for (const session of sessions) {
    const key = String(session.equipment_id);
    if (!latestByEquipment.has(key)) latestByEquipment.set(key, session);
  }

  return plainBikes.map(bike => {
    const session = latestByEquipment.get(String(bike._id || bike.id));
    return {
      ...bike,
      id: String(bike._id || bike.id),
      protection_active: Boolean(session?.active),
      protectionStatus: serializeProtectionSession(session),
    };
  });
}

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
    res.json(await anexarStatusProtecao(bikes));
  } catch (error) {
    res.status(500).json({ message: 'Erro' });
  }
});

// Listar TODAS as bikes (admin ou painel)
router.get('/all', adminMiddleware, async (req, res) => {
  try {
    const bikes = await Bike.find().sort({ createdAt: -1 });
    res.json(await anexarStatusProtecao(bikes));
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
      protection_active: false,
      protectionStatus: null,
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
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identificador de equipamento invalido.' });
    }

    const updates = pickAllowed(req.body, [
      'name',
      'type',
      'brand',
      'serie',
      'color',
      'value',
      'photo',
      'protected',
      'location',
      'lastSeen',
      'rastreamento',
      'plataformaTag',
      'caracteristicas',
      'status',
      'boNumber',
    ]);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Nenhuma alteracao valida foi enviada.' });
    }

    const bike = await Bike.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!bike) return res.status(404).json({ message: 'Bike nao encontrada.' });
    res.json(bike);
  } catch (error) {
    console.error('[Bike-Atualizar] Erro:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Confira os dados informados.' });
    }
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
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identificador de equipamento invalido.' });
    }

    const bike = await Bike.findOne({ _id: req.params.id, userId: req.userId });
    if (!bike) {
      return res.status(404).json({ message: 'Equipamento nao encontrado.' });
    }

    const cobrancasAtivas = await Pagamento.find({ bikeId: bike._id, cobrancaAtiva: true });
    for (const pagamento of cobrancasAtivas) {
      try {
        await cancelarCobrancaAsaas(pagamento);
      } catch (cancelError) {
        console.error('[Bike-Excluir] Falha ao cancelar cobranca:', cancelError.message);
        return res.status(502).json({
          message: 'Nao foi possivel cancelar a cobranca deste equipamento. Tente novamente antes de excluir.',
        });
      }

      pagamento.status = 'cancelado';
      pagamento.cobrancaAtiva = false;
      pagamento.historico.push({
        status: 'cancelado',
        descricao: 'Cobranca cancelada automaticamente porque o equipamento foi excluido',
      });
      await pagamento.save();
    }

    const inativadoAt = new Date();
    const adesivosVinculados = await PrePrintedQR
      .find({ bikeId: bike._id })
      .select('_id vinculadoAt');

    // O adesivo fisico nao pode voltar para a fila e ser entregue a outra pessoa.
    // Antes de remover os vinculos ativos, preserva um retrato para auditoria.
    if (adesivosVinculados.length > 0) {
      await PrePrintedQR.bulkWrite(
        adesivosVinculados.map(adesivo => ({
          updateOne: {
            filter: { _id: adesivo._id, bikeId: bike._id },
            update: {
              $set: {
                status: 'inativo',
                ultimoVinculo: {
                  bikeId: bike._id,
                  userId: req.userId,
                  equipamentoNome: bike.name,
                  equipamentoMarca: bike.brand,
                  equipamentoTipo: bike.type,
                  equipamentoSerie: bike.serie,
                  equipamentoCor: bike.color,
                  proprietarioNome: req.user?.name || '',
                  vinculadoAt: adesivo.vinculadoAt,
                  inativadoAt,
                  motivo: 'Equipamento excluido pelo proprietario',
                },
                bikeId: null,
                userId: null,
              },
            },
          },
        }))
      );
    }

    await bike.deleteOne();
    await sincronizarPlanoUsuario(req.userId);
    res.json({ message: 'Equipamento excluido.', id: bike._id.toString() });
  } catch (error) {
    console.error('[Bike-Excluir] Erro:', error.message);
    res.status(500).json({ message: 'Erro ao excluir o equipamento.' });
  }
});

module.exports = router;
