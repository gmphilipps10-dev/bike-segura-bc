const express = require('express');
const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const ProtectionSession = require('../models/ProtectionSession');
const ProtectionEvent = require('../models/ProtectionEvent');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
  normalizeRadiusMeters,
  isValidCoordinate,
  haversineDistanceMeters,
  equipmentHasActiveGps,
  evaluateProtectionCheck,
} = require('../utils/protection');
const { notificarProtecaoMovimento } = require('./push');

const router = express.Router();

function serializeSession(session) {
  if (!session) return null;
  const raw = typeof session.toJSON === 'function' ? session.toJSON() : session;
  return {
    id: String(raw._id || raw.id),
    equipment_id: String(raw.equipment_id),
    user_id: String(raw.user_id),
    active: Boolean(raw.active),
    radius_meters: raw.radius_meters,
    initial_latitude: raw.initial_latitude,
    initial_longitude: raw.initial_longitude,
    activated_at: raw.activated_at,
    deactivated_at: raw.deactivated_at,
    last_checked_at: raw.last_checked_at,
    outside_detected_at: raw.outside_detected_at,
    alert_triggered: Boolean(raw.alert_triggered),
    alert_triggered_at: raw.alert_triggered_at,
    last_distance_meters: raw.last_distance_meters,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function serializeEvent(event) {
  const raw = typeof event.toJSON === 'function' ? event.toJSON() : event;
  return {
    id: String(raw._id || raw.id),
    protection_session_id: String(raw.protection_session_id),
    equipment_id: String(raw.equipment_id),
    user_id: String(raw.user_id),
    event_type: raw.event_type,
    latitude: raw.latitude,
    longitude: raw.longitude,
    distance_meters: raw.distance_meters,
    radius_meters: raw.radius_meters,
    created_at: raw.created_at,
  };
}

async function createEvent(session, eventType, details = {}) {
  return ProtectionEvent.create({
    protection_session_id: session._id,
    equipment_id: session.equipment_id,
    user_id: session.user_id,
    event_type: eventType,
    latitude: details.latitude ?? null,
    longitude: details.longitude ?? null,
    distance_meters: details.distance_meters ?? null,
    radius_meters: details.radius_meters ?? session.radius_meters,
  });
}

async function findOwnedEquipment(req, res, equipmentId) {
  if (!mongoose.isValidObjectId(equipmentId)) {
    res.status(400).json({ message: 'Identificador de equipamento invalido.' });
    return null;
  }

  const equipment = await Bike.findById(equipmentId);
  if (!equipment) {
    res.status(404).json({ message: 'Equipamento nao encontrado.' });
    return null;
  }

  if (String(equipment.userId) !== String(req.userId)) {
    res.status(403).json({ message: 'Voce so pode operar a protecao dos seus proprios equipamentos.' });
    return null;
  }

  return equipment;
}

router.use(authMiddleware);

router.post('/activate', async (req, res) => {
  try {
    const {
      equipment_id,
      radius_meters,
      initial_latitude,
      initial_longitude,
    } = req.body;

    if (!isValidCoordinate(initial_latitude, initial_longitude)) {
      return res.status(400).json({ message: 'Nao foi possivel ativar a protecao. Localizacao GPS indisponivel.' });
    }

    const equipment = await findOwnedEquipment(req, res, equipment_id);
    if (!equipment) return;

    if (!equipmentHasActiveGps(equipment)) {
      return res.status(400).json({ message: 'Este recurso esta disponivel apenas para equipamentos com rastreador GPS.' });
    }

    const now = new Date();
    await ProtectionSession.updateMany(
      { equipment_id: equipment._id, user_id: req.userId, active: true },
      {
        $set: {
          active: false,
          deactivated_at: now,
          outside_detected_at: null,
        },
      }
    );

    const session = await ProtectionSession.create({
      equipment_id: equipment._id,
      user_id: req.userId,
      active: true,
      radius_meters: normalizeRadiusMeters(radius_meters),
      initial_latitude: Number(initial_latitude),
      initial_longitude: Number(initial_longitude),
      activated_at: now,
      alert_triggered: false,
    });

    const event = await createEvent(session, 'protection_activated', {
      latitude: Number(initial_latitude),
      longitude: Number(initial_longitude),
      radius_meters: session.radius_meters,
    });

    res.status(201).json({
      message: 'Protecao ativada. Seu equipamento esta sendo monitorado.',
      session: serializeSession(session),
      event: serializeEvent(event),
    });
  } catch (error) {
    console.error('[Protection] Erro ao ativar:', error);
    res.status(500).json({ message: 'Erro ao ativar protecao.' });
  }
});

router.post('/deactivate', async (req, res) => {
  try {
    const { equipment_id } = req.body;
    const equipment = await findOwnedEquipment(req, res, equipment_id);
    if (!equipment) return;

    const session = await ProtectionSession.findOne({
      equipment_id: equipment._id,
      user_id: req.userId,
      active: true,
    }).sort({ activated_at: -1 });

    if (!session) {
      return res.json({
        message: 'Protecao ja estava desativada.',
        session: null,
      });
    }

    session.active = false;
    session.deactivated_at = new Date();
    session.outside_detected_at = null;
    await session.save();

    const event = await createEvent(session, 'protection_deactivated');

    res.json({
      message: 'Protecao desativada.',
      session: serializeSession(session),
      event: serializeEvent(event),
    });
  } catch (error) {
    console.error('[Protection] Erro ao desativar:', error);
    res.status(500).json({ message: 'Erro ao desativar protecao.' });
  }
});

router.post('/check-location', async (req, res) => {
  try {
    const {
      equipment_id,
      current_latitude,
      current_longitude,
      timestamp,
    } = req.body;

    if (!isValidCoordinate(current_latitude, current_longitude)) {
      return res.status(400).json({ message: 'Localizacao GPS indisponivel.' });
    }

    const equipment = await findOwnedEquipment(req, res, equipment_id);
    if (!equipment) return;

    const session = await ProtectionSession.findOne({
      equipment_id: equipment._id,
      user_id: req.userId,
      active: true,
    }).sort({ activated_at: -1 });

    if (!session) {
      return res.status(404).json({ message: 'Protecao nao esta ativa para este equipamento.' });
    }

    const now = timestamp ? new Date(timestamp) : new Date();
    const safeNow = Number.isNaN(Number(now)) ? new Date() : now;
    const distanceMeters = haversineDistanceMeters(
      session.initial_latitude,
      session.initial_longitude,
      Number(current_latitude),
      Number(current_longitude)
    );

    const evaluation = evaluateProtectionCheck({
      distanceMeters,
      radiusMeters: session.radius_meters,
      outsideDetectedAt: session.outside_detected_at,
      alertTriggered: session.alert_triggered,
      timestamp: safeNow,
    });

    session.last_checked_at = safeNow;
    session.last_distance_meters = Number(distanceMeters.toFixed(2));

    let event = null;
    if (evaluation.shouldSetOutsideAt) {
      session.outside_detected_at = safeNow;
      event = await createEvent(session, 'outside_area_detected', {
        latitude: Number(current_latitude),
        longitude: Number(current_longitude),
        distance_meters: session.last_distance_meters,
      });
    }

    if (evaluation.shouldClearOutsideAt) {
      event = await createEvent(session, 'outside_area_cancelled', {
        latitude: Number(current_latitude),
        longitude: Number(current_longitude),
        distance_meters: session.last_distance_meters,
      });
      session.outside_detected_at = null;
    }

    if (evaluation.shouldTriggerAlert) {
      session.alert_triggered = true;
      session.alert_triggered_at = safeNow;
      event = await createEvent(session, 'protection_alert_triggered', {
        latitude: Number(current_latitude),
        longitude: Number(current_longitude),
        distance_meters: session.last_distance_meters,
      });

      try {
        if (typeof notificarProtecaoMovimento === 'function') {
          await notificarProtecaoMovimento(equipment, req.userId, {
            distanceMeters: session.last_distance_meters,
            latitude: Number(current_latitude),
            longitude: Number(current_longitude),
            timestamp: safeNow,
          });
        }
      } catch (pushError) {
        console.error('[Protection] Falha ao enviar push:', pushError.message);
      }
    }

    await session.save();

    res.json({
      status: evaluation.status,
      outside: evaluation.outside,
      elapsed_seconds: Number(evaluation.elapsedSeconds.toFixed(1)),
      alert_triggered: Boolean(evaluation.shouldTriggerAlert),
      session: serializeSession(session),
      event: event ? serializeEvent(event) : null,
    });
  } catch (error) {
    console.error('[Protection] Erro ao verificar localizacao:', error);
    res.status(500).json({ message: 'Erro ao verificar localizacao protegida.' });
  }
});

router.get('/status/:equipment_id', async (req, res) => {
  try {
    const equipment = await findOwnedEquipment(req, res, req.params.equipment_id);
    if (!equipment) return;

    const session = await ProtectionSession.findOne({
      equipment_id: equipment._id,
      user_id: req.userId,
    }).sort({ active: -1, updated_at: -1, activated_at: -1 });

    res.json({ session: serializeSession(session) });
  } catch (error) {
    console.error('[Protection] Erro ao carregar status:', error);
    res.status(500).json({ message: 'Erro ao carregar status da protecao.' });
  }
});

router.post('/siren-silenced', async (req, res) => {
  try {
    const { equipment_id } = req.body;
    const equipment = await findOwnedEquipment(req, res, equipment_id);
    if (!equipment) return;

    const session = await ProtectionSession.findOne({
      equipment_id: equipment._id,
      user_id: req.userId,
    }).sort({ active: -1, updated_at: -1, activated_at: -1 });

    if (!session) return res.status(404).json({ message: 'Sessao de protecao nao encontrada.' });

    const event = await createEvent(session, 'siren_silenced');
    res.json({ success: true, event: serializeEvent(event) });
  } catch (error) {
    console.error('[Protection] Erro ao silenciar sirene:', error);
    res.status(500).json({ message: 'Erro ao registrar silenciamento da sirene.' });
  }
});

router.get('/admin/movement-alerts', adminMiddleware, async (req, res) => {
  try {
    const events = await ProtectionEvent.find({
      event_type: { $in: ['outside_area_detected', 'outside_area_cancelled', 'protection_alert_triggered'] },
    })
      .sort({ created_at: -1 })
      .limit(100)
      .populate('equipment_id', 'name brand color serie photo status rastreamento')
      .populate('user_id', 'name email phone')
      .lean();

    res.json(events.map(event => ({
      id: String(event._id),
      type: 'movement',
      event_type: event.event_type,
      equipment: event.equipment_id,
      user: event.user_id,
      latitude: event.latitude,
      longitude: event.longitude,
      distance_meters: event.distance_meters,
      radius_meters: event.radius_meters,
      created_at: event.created_at,
    })));
  } catch (error) {
    console.error('[Protection] Erro ao listar alertas admin:', error);
    res.status(500).json({ message: 'Erro ao listar alertas de movimentacao.' });
  }
});

module.exports = router;
