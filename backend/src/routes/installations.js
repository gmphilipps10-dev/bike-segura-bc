const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const Installation = require('../models/Installation');
const InstallationInventory = require('../models/InstallationInventory');
const Bike = require('../models/Bike');

const publicRouter = express.Router();
const adminRouter = express.Router();

const TRACKER_BUSINESS_DAYS = {
  tag: 5,
  gps: 12,
};

const ALLOWED_TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

const DEFAULT_INVENTORY = [
  { item: 'tag', label: 'TAG / AirTag / Bluetooth', current_quantity: 0, minimum_quantity: 5 },
  { item: 'gps', label: 'Rastreador GPS 4G', current_quantity: 3, minimum_quantity: 2 },
  { item: 'adhesive', label: 'Adesivo casca de ovo', current_quantity: 200, minimum_quantity: 50 },
];

const ADMIN_STATUSES = [
  'dispositivo_em_preparacao',
  'instalacao_agendada',
  'instalado',
  'cancelado',
];

function toNoon(date = new Date()) {
  const value = new Date(date);
  value.setHours(12, 0, 0, 0);
  return value;
}

function toDateOnly(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function isWeekend(date) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}

function addBusinessDays(startDate, days) {
  const result = toNoon(startDate);
  let remaining = Number(days || 0);

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) remaining -= 1;
  }

  return result;
}

function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    throw new Error('Informe uma data valida para a instalacao.');
  }
  const [year, month, day] = String(value).split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(parsed.getTime())) throw new Error('Informe uma data valida para a instalacao.');
  return parsed;
}

function formatDateOnly(date) {
  const value = toNoon(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateBR(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

function normalizeTrackerType(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'gps' || normalized.includes('gps') || normalized.includes('rastreador')) return 'gps';
  if (
    normalized === 'tag'
    || normalized.includes('tag')
    || normalized.includes('bluetooth')
    || normalized.includes('airtag')
  ) return 'tag';
  return '';
}

function trackerTypeFromBikePlan(bike, plan) {
  const texto = `${bike?.rastreamento || ''} ${bike?.plataformaTag || ''} ${plan || bike?.plano || ''}`.toLowerCase();
  if (texto.includes('gps') || texto.includes('rastreador') || plan === 'ouro' || plan === 'diamante') return 'gps';
  if (texto.includes('tag') || texto.includes('bluetooth') || texto.includes('airtag') || plan === 'prata') return 'tag';
  return '';
}

function trackerLabel(type) {
  return type === 'gps' ? 'GPS 4G' : 'TAG';
}

function calculateMinDate(trackerType, baseDate = new Date()) {
  const normalized = normalizeTrackerType(trackerType);
  if (!TRACKER_BUSINESS_DAYS[normalized]) throw new Error('Tipo de dispositivo invalido.');
  return addBusinessDays(baseDate, TRACKER_BUSINESS_DAYS[normalized]);
}

async function ensureInventoryDefaults() {
  await Promise.all(DEFAULT_INVENTORY.map(item => (
    InstallationInventory.updateOne(
      { item: item.item },
      {
        $setOnInsert: {
          item: item.item,
          label: item.label,
          current_quantity: item.current_quantity,
          minimum_quantity: item.minimum_quantity,
          reserved_quantity: 0,
        },
      },
      { upsert: true }
    )
  )));
  return InstallationInventory.find().sort({ item: 1 });
}

function inventoryDTO(item) {
  const current = Number(item.current_quantity || 0);
  const reserved = Number(item.reserved_quantity || 0);
  const minimum = Number(item.minimum_quantity || 0);
  return {
    id: String(item._id),
    item: item.item,
    label: item.label,
    current_quantity: current,
    minimum_quantity: minimum,
    reserved_quantity: reserved,
    available_quantity: Math.max(0, current - reserved),
    below_minimum: current <= minimum,
    updated_at: item.updatedAt,
  };
}

async function getInventoryDTOs() {
  const items = await ensureInventoryDefaults();
  return items.map(inventoryDTO);
}

async function reserveAdhesive(installation) {
  if (installation.adhesive_stock_reserved || installation.stock_consumed) return;
  await ensureInventoryDefaults();
  await InstallationInventory.updateOne(
    { item: 'adhesive' },
    { $inc: { reserved_quantity: 1 } }
  );
  installation.adhesive_reserved = true;
  installation.adhesive_stock_reserved = true;
}

async function reserveGpsIfAvailable(installation) {
  if (installation.tracker_type !== 'gps' || installation.device_reserved || installation.stock_consumed) return;
  await ensureInventoryDefaults();
  const gps = await InstallationInventory.findOne({ item: 'gps' });
  const available = Number(gps?.current_quantity || 0) - Number(gps?.reserved_quantity || 0);
  if (available <= 0) return;

  await InstallationInventory.updateOne(
    { item: 'gps' },
    { $inc: { reserved_quantity: 1 } }
  );
  installation.device_reserved = true;
}

async function releaseReservedStock(installation) {
  if (installation.stock_consumed) return;

  if (installation.adhesive_stock_reserved) {
    await InstallationInventory.updateOne(
      { item: 'adhesive', reserved_quantity: { $gt: 0 } },
      { $inc: { reserved_quantity: -1 } }
    );
    installation.adhesive_stock_reserved = false;
    installation.adhesive_reserved = false;
  }

  if (installation.device_reserved && installation.tracker_type === 'gps') {
    await InstallationInventory.updateOne(
      { item: 'gps', reserved_quantity: { $gt: 0 } },
      { $inc: { reserved_quantity: -1 } }
    );
    installation.device_reserved = false;
  }
}

async function consumeReservedStock(installation) {
  if (installation.stock_consumed) return;
  await ensureInventoryDefaults();

  if (installation.adhesive_stock_reserved) {
    await InstallationInventory.updateOne(
      { item: 'adhesive', reserved_quantity: { $gt: 0 }, current_quantity: { $gt: 0 } },
      { $inc: { reserved_quantity: -1, current_quantity: -1 } }
    );
    installation.adhesive_stock_reserved = false;
  } else if (installation.adhesive_reserved) {
    await InstallationInventory.updateOne(
      { item: 'adhesive', current_quantity: { $gt: 0 } },
      { $inc: { current_quantity: -1 } }
    );
  }

  if (installation.tracker_type === 'gps') {
    if (installation.device_reserved) {
      await InstallationInventory.updateOne(
        { item: 'gps', reserved_quantity: { $gt: 0 }, current_quantity: { $gt: 0 } },
        { $inc: { reserved_quantity: -1, current_quantity: -1 } }
      );
      installation.device_reserved = false;
    } else {
      await InstallationInventory.updateOne(
        { item: 'gps', current_quantity: { $gt: 0 } },
        { $inc: { current_quantity: -1 } }
      );
    }
  }

  installation.stock_consumed = true;
  installation.installed_at = new Date();
}

async function ensureInstallationForBike(bike, options = {}) {
  if (!bike?._id || !bike.userId) return null;
  const trackerType = normalizeTrackerType(options.tracker_type) || trackerTypeFromBikePlan(bike, options.plan);
  if (!trackerType) return null;

  const minDate = calculateMinDate(trackerType);
  let installation = await Installation.findOne({ equipment_id: bike._id });
  let created = false;

  if (!installation) {
    installation = new Installation({
      equipment_id: bike._id,
      user_id: bike.userId,
      tracker_type: trackerType,
      installation_required: true,
      registered_at: new Date(),
      min_installation_date: minDate,
      installation_status: 'dispositivo_em_preparacao',
      adhesive_reserved: true,
    });
    created = true;
  } else if (installation.installation_status !== 'instalado') {
    if (installation.tracker_type !== trackerType) {
      await releaseReservedStock(installation);
      installation.tracker_type = trackerType;
      installation.min_installation_date = minDate;
      installation.installation_date = null;
      installation.installation_time = '';
      installation.installation_address = '';
    }
    if (installation.installation_status === 'cadastro_realizado' || installation.installation_status === 'cancelado') {
      installation.installation_status = 'dispositivo_em_preparacao';
    }
    if (!installation.min_installation_date) installation.min_installation_date = minDate;
    installation.adhesive_reserved = true;
  }

  if (created) await installation.save();
  await reserveAdhesive(installation);
  await reserveGpsIfAvailable(installation);
  await installation.save();
  return installation;
}

async function ensureInstallationForPayment(pagamento) {
  if (!pagamento?.bikeId) return null;
  const bike = await Bike.findById(pagamento.bikeId);
  if (!bike) return null;
  return ensureInstallationForBike(bike, { plan: pagamento.plano });
}

function installationDTO(installation, bike = null, user = null) {
  const plain = typeof installation.toObject === 'function' ? installation.toObject() : installation;
  const bikeDoc = bike || plain.equipment_id || null;
  const userDoc = user || plain.user_id || null;

  return {
    id: String(plain._id || plain.id),
    equipment_id: String(bikeDoc?._id || bikeDoc?.id || plain.equipment_id || ''),
    user_id: String(userDoc?._id || userDoc?.id || plain.user_id || ''),
    tracker_type: plain.tracker_type,
    tracker_label: trackerLabel(plain.tracker_type),
    installation_required: plain.installation_required,
    registered_at: plain.registered_at,
    min_installation_date: plain.min_installation_date,
    min_installation_date_input: plain.min_installation_date ? formatDateOnly(plain.min_installation_date) : '',
    min_installation_date_br: plain.min_installation_date ? formatDateBR(plain.min_installation_date) : '',
    installation_status: plain.installation_status,
    installation_date: plain.installation_date,
    installation_date_input: plain.installation_date ? formatDateOnly(plain.installation_date) : '',
    installation_date_br: plain.installation_date ? formatDateBR(plain.installation_date) : '',
    installation_time: plain.installation_time || '',
    installation_address: plain.installation_address || '',
    adhesive_reserved: Boolean(plain.adhesive_reserved),
    device_reserved: Boolean(plain.device_reserved),
    device_serial_number: plain.device_serial_number || '',
    installed_at: plain.installed_at,
    notes: plain.notes || '',
    equipment: bikeDoc ? {
      id: String(bikeDoc._id || bikeDoc.id || ''),
      name: bikeDoc.name || '',
      brand: bikeDoc.brand || '',
      serie: bikeDoc.serie || '',
      type: bikeDoc.type || '',
      rastreamento: bikeDoc.rastreamento || '',
      plano: bikeDoc.plano || '',
    } : null,
    user: userDoc ? {
      id: String(userDoc._id || userDoc.id || ''),
      name: userDoc.name || '',
      phone: userDoc.phone || '',
      email: userDoc.email || '',
    } : null,
  };
}

function confirmationMessage(installation) {
  return [
    'Bike Segura BC',
    'Seu cadastro ja esta ativo.',
    `Instalacao agendada para: ${formatDateBR(installation.installation_date)} as ${installation.installation_time}.`,
    `Dispositivo: ${trackerLabel(installation.tracker_type)}.`,
    'Enquanto aguarda, voce ja pode utilizar os recursos do aplicativo.',
  ].join('\n');
}

async function buildAdminSummary() {
  const activeFilter = { installation_status: { $nin: ['instalado', 'cancelado'] } };
  const [
    pending,
    scheduled,
    waitingTag,
    waitingGps,
    installed,
    cancelled,
    inventory,
  ] = await Promise.all([
    Installation.countDocuments({ installation_status: { $in: ['cadastro_realizado', 'plano_ativo', 'dispositivo_em_preparacao'] } }),
    Installation.countDocuments({ installation_status: 'instalacao_agendada' }),
    Installation.countDocuments({ ...activeFilter, tracker_type: 'tag' }),
    Installation.countDocuments({ ...activeFilter, tracker_type: 'gps', device_reserved: false }),
    Installation.countDocuments({ installation_status: 'instalado' }),
    Installation.countDocuments({ installation_status: 'cancelado' }),
    getInventoryDTOs(),
  ]);

  const stockByItem = Object.fromEntries(inventory.map(item => [item.item, item]));

  return {
    pending,
    scheduled,
    waiting_tag: waitingTag,
    waiting_gps: waitingGps,
    installed,
    cancelled,
    adhesive_reserved: stockByItem.adhesive?.reserved_quantity || 0,
    gps_stock: stockByItem.gps?.current_quantity || 0,
    tag_stock: stockByItem.tag?.current_quantity || 0,
    inventory_alerts: inventory.filter(item => item.below_minimum).map(item => ({
      item: item.item,
      label: item.label,
      current_quantity: item.current_quantity,
      minimum_quantity: item.minimum_quantity,
    })),
  };
}

publicRouter.post('/calculate-min-date', (req, res) => {
  try {
    const trackerType = normalizeTrackerType(req.body?.tracker_type);
    const minDate = calculateMinDate(trackerType);
    res.json({
      tracker_type: trackerType,
      min_installation_date: minDate,
      min_installation_date_input: formatDateOnly(minDate),
      min_installation_date_br: formatDateBR(minDate),
      business_days: TRACKER_BUSINESS_DAYS[trackerType],
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Nao foi possivel calcular a data minima.' });
  }
});

publicRouter.use(authMiddleware);

publicRouter.get('/my/:equipment_id', async (req, res) => {
  try {
    const bike = await Bike.findOne({ _id: req.params.equipment_id, userId: req.userId });
    if (!bike) return res.status(404).json({ message: 'Equipamento nao encontrado na sua conta.' });

    let installation = await Installation.findOne({ equipment_id: bike._id });
    if (!installation && bike.planoAtivo) {
      installation = await ensureInstallationForBike(bike, { plan: bike.plano });
    }

    if (!installation) {
      return res.status(404).json({ message: 'Este equipamento ainda nao possui instalacao pendente.' });
    }

    res.json({
      installation: installationDTO(installation, bike, req.user),
      allowed_times: ALLOWED_TIMES,
      digital_notice: 'Seu equipamento ja esta ativo no Bike Segura BC. Enquanto aguarda a instalacao, voce ja pode utilizar o cadastro antifurto, QR Code, passaporte digital, alerta de furto e rede de apoio.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar o agendamento.' });
  }
});

publicRouter.post('/schedule', async (req, res) => {
  try {
    const {
      equipment_id,
      tracker_type,
      installation_date,
      installation_time,
      installation_address,
    } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(String(equipment_id || ''))) {
      return res.status(400).json({ message: 'Equipamento invalido.' });
    }

    const bike = await Bike.findOne({ _id: equipment_id, userId: req.userId });
    if (!bike) return res.status(404).json({ message: 'Equipamento nao encontrado na sua conta.' });
    if (!bike.planoAtivo) {
      return res.status(400).json({
        message: 'O agendamento fica disponivel assim que o pagamento do plano for confirmado.',
      });
    }

    const normalizedTracker = normalizeTrackerType(tracker_type) || trackerTypeFromBikePlan(bike, bike.plano);
    if (!normalizedTracker) return res.status(400).json({ message: 'Este plano nao exige instalacao de dispositivo.' });
    if (!ALLOWED_TIMES.includes(String(installation_time || ''))) {
      return res.status(400).json({ message: 'Escolha um horario disponivel para a instalacao.' });
    }
    if (!String(installation_address || '').trim() || String(installation_address).trim().length < 8) {
      return res.status(400).json({ message: 'Informe o endereco ou local de instalacao.' });
    }

    const requestedDate = parseDateOnly(installation_date);
    if (isWeekend(requestedDate)) {
      return res.status(400).json({ message: 'Escolha um dia util para a instalacao.' });
    }

    const installation = await ensureInstallationForBike(bike, { tracker_type: normalizedTracker, plan: bike.plano });
    const minDateOnly = toDateOnly(installation.min_installation_date).getTime();
    const requestedDateOnly = toDateOnly(requestedDate).getTime();
    if (requestedDateOnly < minDateOnly) {
      return res.status(400).json({
        message: `A instalacao deste dispositivo pode ser agendada a partir de ${formatDateBR(installation.min_installation_date)}.`,
      });
    }

    const conflict = await Installation.findOne({
      _id: { $ne: installation._id },
      installation_date: requestedDate,
      installation_time,
      installation_status: 'instalacao_agendada',
    });
    if (conflict) return res.status(409).json({ message: 'Este horario ja esta reservado. Escolha outro horario.' });

    installation.tracker_type = normalizedTracker;
    installation.installation_date = requestedDate;
    installation.installation_time = String(installation_time);
    installation.installation_address = String(installation_address).trim();
    installation.installation_status = 'instalacao_agendada';
    await installation.save();

    res.json({
      success: true,
      installation: installationDTO(installation, bike, req.user),
      whatsapp_message: confirmationMessage(installation),
      message: 'Seu equipamento ja esta ativo no Bike Segura BC. A instalacao fisica do dispositivo sera realizada conforme o prazo tecnico informado.',
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Nao foi possivel confirmar o agendamento.' });
  }
});

adminRouter.use(adminMiddleware);

adminRouter.get('/', async (req, res) => {
  try {
    const { status = '', tracker_type = '' } = req.query;
    const filter = {};

    if (status === 'pendentes') {
      filter.installation_status = { $in: ['cadastro_realizado', 'plano_ativo', 'dispositivo_em_preparacao'] };
    } else if (status) {
      filter.installation_status = status;
    }

    const normalizedTracker = normalizeTrackerType(tracker_type);
    if (normalizedTracker) filter.tracker_type = normalizedTracker;

    const [items, summary, inventory] = await Promise.all([
      Installation.find(filter)
        .populate('user_id', 'name phone email')
        .populate('equipment_id', 'name brand serie type rastreamento plano')
        .sort({ installation_status: 1, installation_date: 1, createdAt: -1 }),
      buildAdminSummary(),
      getInventoryDTOs(),
    ]);

    res.json({
      items: items.map(item => installationDTO(item)),
      summary,
      inventory,
      allowed_times: ALLOWED_TIMES,
    });
  } catch (error) {
    console.error('[Instalacoes] Erro admin list:', error);
    res.status(500).json({ message: 'Erro ao listar instalacoes.' });
  }
});

adminRouter.get('/stock', async (_req, res) => {
  try {
    res.json({ items: await getInventoryDTOs() });
  } catch {
    res.status(500).json({ message: 'Erro ao carregar estoque.' });
  }
});

adminRouter.patch('/stock/:item', async (req, res) => {
  try {
    const item = String(req.params.item || '');
    if (!DEFAULT_INVENTORY.some(defaultItem => defaultItem.item === item)) {
      return res.status(400).json({ message: 'Item de estoque invalido.' });
    }

    await ensureInventoryDefaults();
    const current = Number(req.body?.current_quantity);
    const minimum = Number(req.body?.minimum_quantity);
    const update = { updated_by: String(req.user?.email || req.userId || 'painel-admin') };

    if (Number.isFinite(current) && current >= 0) update.current_quantity = Math.floor(current);
    if (Number.isFinite(minimum) && minimum >= 0) update.minimum_quantity = Math.floor(minimum);

    const updated = await InstallationInventory.findOneAndUpdate({ item }, { $set: update }, { new: true });
    res.json({ success: true, item: inventoryDTO(updated), items: await getInventoryDTOs() });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Nao foi possivel atualizar o estoque.' });
  }
});

adminRouter.patch('/:id/status', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id || ''))) {
      return res.status(400).json({ message: 'Agendamento invalido.' });
    }

    const status = String(req.body?.installation_status || req.body?.status || '');
    if (!ADMIN_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status invalido para instalacao.' });
    }

    const installation = await Installation.findById(req.params.id)
      .populate('user_id', 'name phone email')
      .populate('equipment_id', 'name brand serie type rastreamento plano');
    if (!installation) return res.status(404).json({ message: 'Agendamento nao encontrado.' });

    if (status === 'instalado') {
      await consumeReservedStock(installation);
      installation.installation_status = 'instalado';
    } else if (status === 'cancelado') {
      await releaseReservedStock(installation);
      installation.installation_status = 'cancelado';
    } else {
      installation.installation_status = status;
    }

    if (typeof req.body?.notes === 'string') installation.notes = req.body.notes.trim();
    await installation.save();

    res.json({
      success: true,
      installation: installationDTO(installation),
      summary: await buildAdminSummary(),
      inventory: await getInventoryDTOs(),
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Nao foi possivel atualizar o status.' });
  }
});

adminRouter.patch('/:id/device', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id || ''))) {
      return res.status(400).json({ message: 'Agendamento invalido.' });
    }

    const installation = await Installation.findById(req.params.id)
      .populate('user_id', 'name phone email')
      .populate('equipment_id', 'name brand serie type rastreamento plano');
    if (!installation) return res.status(404).json({ message: 'Agendamento nao encontrado.' });

    const serial = String(req.body?.device_serial_number || '').trim();
    if (!serial) return res.status(400).json({ message: 'Informe o numero de serie do dispositivo.' });

    installation.device_serial_number = serial;
    if (typeof req.body?.notes === 'string') installation.notes = req.body.notes.trim();
    await consumeReservedStock(installation);
    installation.installation_status = 'instalado';
    await installation.save();

    res.json({
      success: true,
      installation: installationDTO(installation),
      summary: await buildAdminSummary(),
      inventory: await getInventoryDTOs(),
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Nao foi possivel vincular o dispositivo.' });
  }
});

module.exports = {
  publicRouter,
  adminRouter,
  ensureInstallationForPayment,
  ensureInstallationForBike,
  addBusinessDays,
  calculateMinDate,
};
