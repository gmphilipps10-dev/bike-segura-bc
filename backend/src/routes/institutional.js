const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const adminMiddleware = require('../middleware/admin');
const { institutionalAuth, requireInstitutionalAdmin } = require('../middleware/institutionalAuth');
const Bike = require('../models/Bike');
const User = require('../models/User');
const PrePrintedQR = require('../models/PrePrintedQR');
const InstitutionalUser = require('../models/InstitutionalUser');
const InstitutionalAccessLog = require('../models/InstitutionalAccessLog');
const InstitutionalTrigger = require('../models/InstitutionalTrigger');

const publicRouter = express.Router();
const adminRouter = express.Router();

const OWNER_REASONS = {
  recuperacao: 'Recuperacao de equipamento',
  abandonado: 'Equipamento abandonado',
  averiguacao_operacional: 'Averiguacao operacional',
  contato_autorizado: 'Contato autorizado pelo proprietario',
  outro: 'Outro motivo operacional',
};

const TRIGGER_REASONS = {
  recuperacao: 'Apoio em recuperacao',
  alerta_furto: 'Alerta de furto ativo',
  contato_proprietario: 'Contato com proprietario',
  suporte_operacional: 'Suporte operacional',
  outro: 'Outro motivo operacional',
};

function safeString(value, max = 240) {
  return String(value ?? '').trim().slice(0, max);
}

function normalizeEmail(value) {
  return safeString(value, 180).toLowerCase();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getRequestIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] || '';
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || '';
}

function publicInstitutionalUser(user) {
  if (!user) return null;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  if (plain._id && !plain.id) plain.id = String(plain._id);
  delete plain.password_hash;
  return plain;
}

function logUserSnapshot(user) {
  if (!user) return {};
  return {
    userId: user._id,
    userName: user.name || '',
    userEmail: user.email || '',
    role: user.role || '',
    institution: user.institution || '',
  };
}

async function writeAccessLog(req, user, action, details = {}) {
  try {
    await InstitutionalAccessLog.create({
      ...logUserSnapshot(user),
      action,
      ip: getRequestIp(req),
      userAgent: safeString(req.get('user-agent'), 500),
      resourceType: safeString(details.resourceType, 80),
      resourceId: safeString(details.resourceId, 80),
      searchTerm: safeString(details.searchTerm, 140),
      searchType: safeString(details.searchType, 80),
      reason: safeString(details.reason, 80),
      reasonText: safeString(details.reasonText, 500),
      metadata: details.metadata || {},
    });
  } catch (error) {
    console.error('[Institutional] Falha ao gravar log:', error.message);
  }
}

async function writeAdminAccessLog(req, action, details = {}) {
  try {
    const user = req.user || {};
    await InstitutionalAccessLog.create({
      userName: user.name || (req.isPainelAdmin ? 'Painel Admin' : 'Admin Bike Segura'),
      userEmail: user.email || (req.isPainelAdmin ? 'painel-admin' : ''),
      role: 'admin_bike_segura',
      institution: 'BIKE_SEGURA',
      action,
      ip: getRequestIp(req),
      userAgent: safeString(req.get('user-agent'), 500),
      resourceType: safeString(details.resourceType, 80),
      resourceId: safeString(details.resourceId, 80),
      reason: safeString(details.reason, 80),
      reasonText: safeString(details.reasonText, 500),
      metadata: details.metadata || {},
    });
  } catch (error) {
    console.error('[Institutional] Falha ao gravar log admin:', error.message);
  }
}

function tokenPayload(user) {
  return {
    scope: 'institutional',
    institutionalUserId: user._id,
    role: user.role,
    institution: user.institution,
  };
}

function maskCpf(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 11) return '';
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

function maskSerial(value) {
  const serial = safeString(value, 120);
  if (!serial) return '';
  if (serial.length <= 4) return `${serial.slice(0, 1)}***`;
  const first = Math.min(3, Math.ceil(serial.length / 3));
  const last = Math.min(3, Math.floor(serial.length / 3));
  return `${serial.slice(0, first)}***${serial.slice(-last)}`;
}

function cityUfFromLocation(value) {
  const location = safeString(value, 120);
  if (!location) return 'Balneario Camboriu/SC';
  const parts = location.split(',').map(part => part.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}/${parts[1].slice(0, 2).toUpperCase()}`;
  return location;
}

function equipmentGuidance(status) {
  if (status === 'furto') {
    return 'Nao abordar sozinho. Confirmar dados visuais, preservar o local quando cabivel, acionar a guarnicao responsavel e registrar a consulta no procedimento operacional.';
  }
  return 'Consulta operacional. Dados do proprietario exigem motivo formal e ficam registrados para auditoria LGPD.';
}

function equipmentSummary(bike, options = {}) {
  const isTheft = bike.status === 'furto';
  const summary = {
    id: String(bike._id),
    status: bike.status,
    type: bike.type || '',
    brand: bike.brand || '',
    model: bike.name || '',
    color: bike.color || '',
    photo: bike.photo || null,
    serieMasked: maskSerial(bike.serie),
    cityUf: cityUfFromLocation(bike.location),
    createdAt: bike.createdAt,
    updatedAt: bike.updatedAt,
    alert: isTheft,
    guidance: equipmentGuidance(bike.status),
  };

  if (options.includeQr && options.qr) {
    summary.qr = {
      stickerNumber: options.qr.stickerNumber,
      status: options.qr.status,
    };
  }

  if (isTheft) {
    summary.alertDetails = {
      serie: bike.serie || '',
      alertDate: bike.alertDate,
      boNumber: bike.boNumber || '',
      location: bike.location || '',
      caracteristicas: bike.caracteristicas || '',
      rastreamento: bike.rastreamento || '',
      plataformaTag: bike.plataformaTag || '',
    };
  } else if (options.includeOperationalDetails) {
    summary.operationalDetails = {
      caracteristicas: bike.caracteristicas || '',
      rastreamento: bike.rastreamento ? maskSerial(bike.rastreamento) : '',
      plataformaTag: bike.plataformaTag ? maskSerial(bike.plataformaTag) : '',
    };
  }

  return summary;
}

function qrCandidates(rawValue) {
  const raw = safeString(rawValue, 220);
  const decoded = (() => {
    try { return decodeURIComponent(raw); } catch { return raw; }
  })();
  const candidates = new Set();
  [raw, decoded].forEach(item => {
    if (!item) return;
    candidates.add(item.trim());
    item.split(/[^a-zA-Z0-9-]+/).filter(Boolean).forEach(part => candidates.add(part.trim()));
  });

  const compact = decoded.toUpperCase().replace(/\s+/g, '');
  const stickerMatch = compact.match(/BSBC-?\d{1,8}/);
  if (stickerMatch) {
    const digits = stickerMatch[0].replace(/\D/g, '');
    candidates.add(`BSBC-${digits.padStart(4, '0')}`);
    candidates.add(`BSBC-${digits}`);
  }

  return Array.from(candidates)
    .map(candidate => safeString(candidate, 120))
    .filter(Boolean);
}

async function findBikeByQr(rawValue) {
  const candidates = qrCandidates(rawValue);
  if (!candidates.length) return null;

  const upperCandidates = candidates.map(item => item.toUpperCase());
  const lowerCandidates = candidates.map(item => item.toLowerCase());
  const qr = await PrePrintedQR.findOne({
    $or: [
      { stickerNumber: { $in: upperCandidates } },
      { hash: { $in: lowerCandidates } },
    ],
  }).lean();

  if (qr?.bikeId) {
    const bike = await Bike.findById(qr.bikeId).lean();
    if (bike) return { bike, qr };
  }
  if (qr?.hash) {
    const bike = await Bike.findOne({ hash: qr.hash }).lean();
    if (bike) return { bike, qr };
  }

  const bike = await Bike.findOne({ hash: { $in: lowerCandidates } }).lean();
  if (!bike) return null;
  return { bike, qr: null };
}

function searchFieldsForType(type) {
  const fields = {
    qr: [],
    serie: ['serie'],
    quadro: ['serie'],
    rastreador: ['rastreamento', 'plataformaTag'],
    marca: ['brand'],
    modelo: ['name'],
    cor: ['color'],
    caracteristicas: ['caracteristicas'],
    tipo: ['type'],
    geral: ['serie', 'brand', 'name', 'color', 'caracteristicas', 'type', 'rastreamento', 'plataformaTag'],
  };
  return fields[type] || fields.geral;
}

function validateReason(reason, reasonText, allowedReasons) {
  const normalized = safeString(reason, 80);
  const text = safeString(reasonText, 500);
  if (!allowedReasons[normalized]) {
    return { error: 'Informe um motivo operacional valido.' };
  }
  if (normalized === 'outro' && text.length < 5) {
    return { error: 'Descreva o motivo operacional.' };
  }
  return { reason: normalized, reasonText: text, label: allowedReasons[normalized] };
}

function institutionForRole(role) {
  if (role === 'institucional_gm') return 'GMBC';
  if (role === 'institucional_pm') return 'PMBC';
  if (role === 'admin_bike_segura') return 'BIKE_SEGURA';
  return '';
}

function validateRoleInstitution(role, institution) {
  const expected = institutionForRole(role);
  if (!expected) return 'Perfil institucional invalido.';
  if (institution && institution !== expected) return 'Instituicao nao combina com o perfil informado.';
  return '';
}

function logQueryForInstitution(user) {
  if (user.role === 'admin_bike_segura') return {};
  return { institution: user.institution };
}

function serializeLog(log) {
  return {
    id: String(log._id),
    userName: log.userName,
    userEmail: log.userEmail,
    role: log.role,
    institution: log.institution,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    searchTerm: log.searchTerm,
    searchType: log.searchType,
    reason: log.reason,
    reasonText: log.reasonText,
    metadata: log.metadata || {},
    createdAt: log.createdAt,
  };
}

publicRouter.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  try {
    if (!email || !password) {
      await writeAccessLog(req, null, 'login_failed', { metadata: { email, reason: 'missing_credentials' } });
      return res.status(400).json({ message: 'Informe email e senha.' });
    }

    const user = await InstitutionalUser.findOne({ email });
    if (!user || user.status !== 'active') {
      await writeAccessLog(req, user, 'login_failed', { metadata: { email, reason: 'inactive_or_not_found' } });
      return res.status(403).json({ message: 'Credenciais institucionais invalidas.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      await writeAccessLog(req, user, 'login_failed', { metadata: { email, reason: 'wrong_password' } });
      return res.status(403).json({ message: 'Credenciais institucionais invalidas.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(tokenPayload(user), process.env.JWT_SECRET, { expiresIn: '8h' });
    await writeAccessLog(req, user, 'login_success');

    res.json({
      token,
      user: publicInstitutionalUser(user),
    });
  } catch (error) {
    console.error('[Institutional] Login error:', error);
    res.status(500).json({ message: 'Erro ao fazer login institucional.' });
  }
});

publicRouter.post('/logout', institutionalAuth, async (req, res) => {
  await writeAccessLog(req, req.institutionalUser, 'logout');
  res.json({ success: true });
});

publicRouter.get('/me', institutionalAuth, async (req, res) => {
  await writeAccessLog(req, req.institutionalUser, 'me');
  res.json({ user: publicInstitutionalUser(req.institutionalUser) });
});

publicRouter.get('/dashboard', institutionalAuth, async (req, res) => {
  try {
    const today = startOfDay();
    const last7Days = addDays(new Date(), -7);
    const institutionFilter = logQueryForInstitution(req.institutionalUser);

    const [
      totalEquipamentos,
      alertasFurto,
      recuperados,
      consultasHoje,
      novosUltimos7Dias,
      acionamentosAbertos,
    ] = await Promise.all([
      Bike.countDocuments(),
      Bike.countDocuments({ status: 'furto' }),
      Bike.countDocuments({ status: 'recuperada' }),
      InstitutionalAccessLog.countDocuments({
        ...institutionFilter,
        action: { $in: ['search', 'view_equipment', 'view_owner_data'] },
        createdAt: { $gte: today },
      }),
      Bike.countDocuments({ createdAt: { $gte: last7Days } }),
      InstitutionalTrigger.countDocuments({
        ...(req.institutionalUser.role === 'admin_bike_segura' ? {} : { institution: req.institutionalUser.institution }),
        status: { $in: ['open', 'in_progress'] },
      }),
    ]);

    await writeAccessLog(req, req.institutionalUser, 'dashboard');

    res.json({
      cards: {
        totalEquipamentos,
        alertasFurto,
        recuperados,
        consultasHoje,
        novosUltimos7Dias,
        acionamentosAbertos,
      },
      lgpd: {
        dadosPessoais: false,
        observacao: 'Indicadores agregados, sem dados pessoais do proprietario.',
      },
    });
  } catch (error) {
    console.error('[Institutional] Dashboard error:', error);
    res.status(500).json({ message: 'Erro ao carregar dashboard institucional.' });
  }
});

publicRouter.get('/search', institutionalAuth, async (req, res) => {
  try {
    const term = safeString(req.query.q, 120);
    const type = safeString(req.query.type || 'geral', 60);
    if (term.length < 2) {
      return res.status(400).json({ message: 'Informe pelo menos 2 caracteres para consulta.' });
    }

    const byQr = await findBikeByQr(term);
    const resultsById = new Map();
    if (byQr?.bike) {
      resultsById.set(String(byQr.bike._id), equipmentSummary(byQr.bike, { includeQr: true, qr: byQr.qr }));
    }

    if (type !== 'qr') {
      const fields = searchFieldsForType(type);
      const regex = new RegExp(escapeRegex(term), 'i');
      const bikes = await Bike.find({
        $or: fields.map(field => ({ [field]: regex })),
      })
        .sort({ status: 1, updatedAt: -1 })
        .limit(25)
        .lean();

      bikes.forEach(bike => {
        const id = String(bike._id);
        if (!resultsById.has(id)) resultsById.set(id, equipmentSummary(bike));
      });
    }

    const results = Array.from(resultsById.values()).slice(0, 25);
    await writeAccessLog(req, req.institutionalUser, 'search', {
      searchTerm: term,
      searchType: type,
      metadata: { resultCount: results.length },
    });

    res.json({ results });
  } catch (error) {
    console.error('[Institutional] Search error:', error);
    res.status(500).json({ message: 'Erro ao consultar equipamentos.' });
  }
});

publicRouter.get('/equipment/:id', institutionalAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Equipamento invalido.' });
    }

    const bike = await Bike.findById(req.params.id).lean();
    if (!bike) return res.status(404).json({ message: 'Equipamento nao encontrado.' });

    const qr = await PrePrintedQR.findOne({
      $or: [
        { bikeId: bike._id },
        { hash: bike.hash },
      ],
    }).lean();

    await writeAccessLog(req, req.institutionalUser, 'view_equipment', {
      resourceType: 'bike',
      resourceId: String(bike._id),
      metadata: { status: bike.status },
    });

    res.json({ equipment: equipmentSummary(bike, { includeQr: true, qr, includeOperationalDetails: true }) });
  } catch (error) {
    console.error('[Institutional] Equipment error:', error);
    res.status(500).json({ message: 'Erro ao carregar equipamento.' });
  }
});

publicRouter.post('/equipment/:id/view-owner', institutionalAuth, async (req, res) => {
  try {
    const validation = validateReason(req.body?.reason, req.body?.reasonText, OWNER_REASONS);
    if (validation.error) return res.status(400).json({ message: validation.error });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Equipamento invalido.' });
    }

    const bike = await Bike.findById(req.params.id).lean();
    if (!bike) return res.status(404).json({ message: 'Equipamento nao encontrado.' });

    const owner = await User.findById(bike.userId)
      .select('name email phone cpf contatoEmergencia')
      .lean();
    if (!owner) return res.status(404).json({ message: 'Proprietario nao encontrado.' });

    await writeAccessLog(req, req.institutionalUser, 'view_owner_data', {
      resourceType: 'bike',
      resourceId: String(bike._id),
      reason: validation.reason,
      reasonText: validation.reasonText,
      metadata: {
        reasonLabel: validation.label,
        fieldsShown: ['name', 'phone', 'email', 'cpfMasked', 'contatoEmergencia'],
      },
    });

    res.json({
      owner: {
        name: owner.name || '',
        phone: owner.phone || '',
        email: owner.email || '',
        cpfMasked: maskCpf(owner.cpf),
        notes: owner.contatoEmergencia || '',
      },
      audit: {
        reason: validation.reason,
        reasonLabel: validation.label,
        registeredAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Institutional] Owner view error:', error);
    res.status(500).json({ message: 'Erro ao liberar dados do proprietario.' });
  }
});

publicRouter.post('/equipment/:id/trigger-bike-segura', institutionalAuth, async (req, res) => {
  try {
    const validation = validateReason(req.body?.reason, req.body?.reasonText, TRIGGER_REASONS);
    if (validation.error) return res.status(400).json({ message: validation.error });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Equipamento invalido.' });
    }

    const bike = await Bike.findById(req.params.id).lean();
    if (!bike) return res.status(404).json({ message: 'Equipamento nao encontrado.' });

    const trigger = await InstitutionalTrigger.create({
      bikeId: bike._id,
      ownerId: bike.userId || null,
      institutionalUserId: req.institutionalUser._id,
      userName: req.institutionalUser.name,
      userEmail: req.institutionalUser.email,
      role: req.institutionalUser.role,
      institution: req.institutionalUser.institution,
      reason: validation.reason,
      reasonText: validation.reasonText,
      equipmentSnapshot: equipmentSummary(bike),
    });

    await writeAccessLog(req, req.institutionalUser, 'trigger_bike_segura', {
      resourceType: 'bike',
      resourceId: String(bike._id),
      reason: validation.reason,
      reasonText: validation.reasonText,
      metadata: {
        reasonLabel: validation.label,
        triggerId: String(trigger._id),
      },
    });

    res.status(201).json({
      success: true,
      trigger: {
        id: String(trigger._id),
        status: trigger.status,
        createdAt: trigger.createdAt,
      },
      message: 'Acionamento registrado para a equipe Bike Segura BC.',
    });
  } catch (error) {
    console.error('[Institutional] Trigger error:', error);
    res.status(500).json({ message: 'Erro ao acionar Bike Segura BC.' });
  }
});

publicRouter.get('/alerts', institutionalAuth, async (req, res) => {
  try {
    const alerts = await Bike.find({ status: 'furto' })
      .sort({ alertDate: -1, updatedAt: -1 })
      .limit(100)
      .lean();

    await writeAccessLog(req, req.institutionalUser, 'view_alerts', {
      metadata: { resultCount: alerts.length },
    });

    res.json({ alerts: alerts.map(bike => equipmentSummary(bike)) });
  } catch (error) {
    console.error('[Institutional] Alerts error:', error);
    res.status(500).json({ message: 'Erro ao carregar alertas.' });
  }
});

publicRouter.get('/logs', institutionalAuth, async (req, res) => {
  try {
    const query = {
      ...logQueryForInstitution(req.institutionalUser),
    };
    const action = safeString(req.query.action, 80);
    if (action) query.action = action;

    const logs = await InstitutionalAccessLog.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    await writeAccessLog(req, req.institutionalUser, 'view_logs', {
      metadata: { resultCount: logs.length },
    });

    res.json({ logs: logs.map(serializeLog) });
  } catch (error) {
    console.error('[Institutional] Logs error:', error);
    res.status(500).json({ message: 'Erro ao carregar historico.' });
  }
});

publicRouter.get('/triggers', institutionalAuth, requireInstitutionalAdmin, async (req, res) => {
  try {
    const triggers = await InstitutionalTrigger.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({ triggers });
  } catch (error) {
    console.error('[Institutional] Admin triggers error:', error);
    res.status(500).json({ message: 'Erro ao carregar acionamentos.' });
  }
});

adminRouter.use(adminMiddleware);

adminRouter.get('/users', async (req, res) => {
  try {
    const users = await InstitutionalUser.find()
      .sort({ createdAt: -1 })
      .lean();
    await writeAdminAccessLog(req, 'admin_list_institutional_users', { metadata: { resultCount: users.length } });
    res.json({ users: users.map(user => publicInstitutionalUser(user)) });
  } catch (error) {
    console.error('[Institutional] Admin users list error:', error);
    res.status(500).json({ message: 'Erro ao listar usuarios institucionais.' });
  }
});

adminRouter.post('/users', async (req, res) => {
  try {
    const name = safeString(req.body?.name, 120);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const role = safeString(req.body?.role, 80);
    const institution = safeString(req.body?.institution || institutionForRole(role), 40);
    const validationError = validateRoleInstitution(role, institution);

    if (!name || !email || !password || validationError) {
      return res.status(400).json({ message: validationError || 'Informe nome, email, senha e perfil.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'A senha institucional deve ter pelo menos 8 caracteres.' });
    }

    const exists = await InstitutionalUser.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Este email institucional ja esta cadastrado.' });

    const user = await InstitutionalUser.create({
      name,
      email,
      password_hash: await bcrypt.hash(password, 10),
      role,
      institution,
      department: safeString(req.body?.department, 120),
      phone: safeString(req.body?.phone, 40),
      badgeNumber: safeString(req.body?.badgeNumber, 80),
      status: req.body?.status === 'inactive' ? 'inactive' : 'active',
      createdBy: req.user?.email || (req.isPainelAdmin ? 'painel-admin' : 'admin'),
    });

    await writeAdminAccessLog(req, 'admin_create_institutional_user', {
      resourceType: 'institutional_user',
      resourceId: String(user._id),
      metadata: { email: user.email, role: user.role, institution: user.institution },
    });

    res.status(201).json({ user: publicInstitutionalUser(user) });
  } catch (error) {
    console.error('[Institutional] Admin create user error:', error);
    res.status(500).json({ message: 'Erro ao criar usuario institucional.' });
  }
});

adminRouter.patch('/users/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Usuario institucional invalido.' });
    }

    const user = await InstitutionalUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario institucional nao encontrado.' });

    const updates = {};
    ['name', 'department', 'phone', 'badgeNumber'].forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        updates[field] = safeString(req.body[field], field === 'name' ? 120 : 160);
      }
    });
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'email')) {
      const email = normalizeEmail(req.body.email);
      if (!email) return res.status(400).json({ message: 'Email invalido.' });
      const existing = await InstitutionalUser.findOne({ email, _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ message: 'Email ja usado por outro usuario institucional.' });
      updates.email = email;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'role')) {
      const role = safeString(req.body.role, 80);
      const institution = institutionForRole(role);
      const validationError = validateRoleInstitution(role, institution);
      if (validationError) return res.status(400).json({ message: validationError });
      updates.role = role;
      updates.institution = institution;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'status')) {
      updates.status = req.body.status === 'inactive' ? 'inactive' : 'active';
    }
    if (req.body?.password) {
      const password = String(req.body.password);
      if (password.length < 8) {
        return res.status(400).json({ message: 'A senha institucional deve ter pelo menos 8 caracteres.' });
      }
      updates.password_hash = await bcrypt.hash(password, 10);
    }
    updates.updatedBy = req.user?.email || (req.isPainelAdmin ? 'painel-admin' : 'admin');

    Object.assign(user, updates);
    await user.save();

    await writeAdminAccessLog(req, 'admin_update_institutional_user', {
      resourceType: 'institutional_user',
      resourceId: String(user._id),
      metadata: { fields: Object.keys(updates).filter(field => field !== 'password_hash') },
    });

    res.json({ user: publicInstitutionalUser(user) });
  } catch (error) {
    console.error('[Institutional] Admin update user error:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuario institucional.' });
  }
});

adminRouter.get('/logs', async (req, res) => {
  try {
    const query = {};
    const institution = safeString(req.query.institution, 40);
    const action = safeString(req.query.action, 80);
    if (institution) query.institution = institution;
    if (action) query.action = action;

    const logs = await InstitutionalAccessLog.find(query)
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    await writeAdminAccessLog(req, 'admin_view_institutional_logs', { metadata: { resultCount: logs.length } });
    res.json({ logs: logs.map(serializeLog) });
  } catch (error) {
    console.error('[Institutional] Admin logs error:', error);
    res.status(500).json({ message: 'Erro ao carregar logs institucionais.' });
  }
});

adminRouter.get('/triggers', async (req, res) => {
  try {
    const status = safeString(req.query.status, 40);
    const query = status ? { status } : {};
    const triggers = await InstitutionalTrigger.find(query)
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    await writeAdminAccessLog(req, 'admin_view_institutional_triggers', { metadata: { resultCount: triggers.length } });
    res.json({ triggers });
  } catch (error) {
    console.error('[Institutional] Admin triggers error:', error);
    res.status(500).json({ message: 'Erro ao carregar acionamentos institucionais.' });
  }
});

adminRouter.patch('/triggers/:id/status', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Acionamento invalido.' });
    }
    const allowed = ['open', 'in_progress', 'resolved', 'dismissed'];
    const status = safeString(req.body?.status, 40);
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Status de acionamento invalido.' });
    }

    const trigger = await InstitutionalTrigger.findById(req.params.id);
    if (!trigger) return res.status(404).json({ message: 'Acionamento nao encontrado.' });

    trigger.status = status;
    trigger.notes = safeString(req.body?.notes, 1000);
    if (status === 'resolved' || status === 'dismissed') {
      trigger.resolvedAt = new Date();
      trigger.resolvedBy = req.user?.email || (req.isPainelAdmin ? 'painel-admin' : 'admin');
    }
    await trigger.save();

    await writeAdminAccessLog(req, 'admin_update_institutional_trigger', {
      resourceType: 'institutional_trigger',
      resourceId: String(trigger._id),
      metadata: { status: trigger.status },
    });

    res.json({ trigger });
  } catch (error) {
    console.error('[Institutional] Admin trigger update error:', error);
    res.status(500).json({ message: 'Erro ao atualizar acionamento institucional.' });
  }
});

module.exports = {
  publicRouter,
  adminRouter,
  OWNER_REASONS,
  TRIGGER_REASONS,
};
