const express = require('express');
const jwt = require('jsonwebtoken');
const AppAnalytics = require('../models/AppAnalytics');
const adminMiddleware = require('../middleware/admin');

const publicRouter = express.Router();
const adminRouter = express.Router();

const EVENT_TYPES = new Set(['app_open', 'page_view', 'button_click']);
const SAO_PAULO_UTC_OFFSET_HOURS = 3;

function cleanText(value, maxLength = 120) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function getTokenUserId(req) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return '';

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id || decoded.id === 'painel-admin') return '';
    return cleanText(decoded.id, 80);
  } catch {
    return '';
  }
}

function inicioDiaSaoPaulo(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return new Date(Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    SAO_PAULO_UTC_OFFSET_HOURS,
    0,
    0,
    0
  ));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function countAppOpensSince(startDate, endDate = null) {
  const dateMatch = endDate ? { $gte: startDate, $lt: endDate } : { $gte: startDate };
  return AppAnalytics.countDocuments({
    $or: [
      { event_type: 'app_open', created_at: dateMatch },
      { eventType: 'app_open', createdAt: dateMatch },
    ],
  });
}

async function buildAnalyticsSummary() {
  const agora = new Date();
  const hojeInicio = inicioDiaSaoPaulo(agora);
  const amanhaInicio = addDays(hojeInicio, 1);
  const ultimos7Dias = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ultimos30Dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

  const normalizeFields = {
    event: { $ifNull: ['$event_type', '$eventType'] },
    visitorUser: { $ifNull: ['$user_id', '$userId'] },
    visitorAnon: { $ifNull: ['$anonymous_id', '$anonymousId'] },
    date: { $ifNull: ['$created_at', '$createdAt'] },
    buttonLabel: { $ifNull: ['$button_name', '$button'] },
    advertiserId: { $ifNull: ['$advertiser_id', '$advertiserId'] },
    advertiserName: { $ifNull: ['$advertiser_name', '$advertiserName'] },
  };

  const [
    acessosHoje,
    acessosUltimos7Dias,
    acessosUltimos30Dias,
    usuariosUnicosAgg,
    cliquesPorBotao,
    cliquesAnunciantes,
    paginasMaisAcessadas,
  ] = await Promise.all([
    countAppOpensSince(hojeInicio, amanhaInicio),
    countAppOpensSince(ultimos7Dias),
    countAppOpensSince(ultimos30Dias),
    AppAnalytics.aggregate([
      { $project: normalizeFields },
      { $match: { date: { $gte: ultimos30Dias } } },
      {
        $project: {
          visitor: {
            $cond: [
              { $ne: ['$visitorUser', ''] },
              { $concat: ['user:', '$visitorUser'] },
              { $concat: ['anon:', '$visitorAnon'] },
            ],
          },
        },
      },
      { $match: { visitor: { $nin: ['user:', 'anon:'] } } },
      { $group: { _id: '$visitor' } },
      { $count: 'total' },
    ]),
    AppAnalytics.aggregate([
      { $project: normalizeFields },
      {
        $match: {
          event: 'button_click',
          buttonLabel: { $exists: true, $ne: '' },
          date: { $gte: ultimos30Dias },
        },
      },
      { $group: { _id: '$buttonLabel', total: { $sum: 1 } } },
      { $sort: { total: -1, _id: 1 } },
      { $limit: 20 },
      { $project: { _id: 0, button: '$_id', button_name: '$_id', total: 1 } },
    ]),
    AppAnalytics.aggregate([
      { $project: normalizeFields },
      {
        $match: {
          event: 'button_click',
          advertiserName: { $exists: true, $ne: '' },
          date: { $gte: ultimos30Dias },
        },
      },
      {
        $group: {
          _id: {
            id: '$advertiserId',
            name: '$advertiserName',
          },
          total: { $sum: 1 },
          hoje: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$date', hojeInicio] }, { $lt: ['$date', amanhaInicio] }] },
                1,
                0,
              ],
            },
          },
          ultimoCliqueEm: { $max: '$date' },
        },
      },
      { $sort: { total: -1, '_id.name': 1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          advertiser_id: '$_id.id',
          advertiser_name: '$_id.name',
          total: 1,
          hoje: 1,
          ultimoCliqueEm: 1,
        },
      },
    ]),
    AppAnalytics.aggregate([
      { $project: { ...normalizeFields, page: 1 } },
      {
        $match: {
          event: 'page_view',
          page: { $exists: true, $ne: '' },
          date: { $gte: ultimos30Dias },
        },
      },
      { $group: { _id: '$page', total: { $sum: 1 } } },
      { $sort: { total: -1, _id: 1 } },
      { $limit: 20 },
      { $project: { _id: 0, page: '$_id', total: 1 } },
    ]),
  ]);

  return {
      acessosHoje,
      acessosUltimos7Dias,
      acessosUltimos30Dias,
      usuariosUnicos: usuariosUnicosAgg[0]?.total || 0,
      cliquesPorBotao,
      cliquesAnunciantes,
      totalCliquesAnunciantes: cliquesAnunciantes.reduce((total, item) => total + Number(item.total || 0), 0),
      paginasMaisAcessadas,
      janela: 'ultimos_30_dias',
      lgpd: {
        coletaDadosSensiveis: false,
        observacao: 'Analytics coleta apenas evento, pagina, botao, usuario/visitante anonimo e user-agent.',
      },
  };
}

publicRouter.post('/event', async (req, res) => {
  try {
    const eventType = cleanText(req.body?.event_type || req.body?.eventType, 40);
    if (!EVENT_TYPES.has(eventType)) {
      return res.status(400).json({ message: 'Tipo de evento invalido.' });
    }

    const userId = getTokenUserId(req);
    const page = cleanText(req.body?.page || '/', 180);
    const button = eventType === 'button_click'
      ? cleanText(req.body?.button_name || req.body?.button, 120)
      : '';
    const anonymousId = userId ? '' : cleanText(req.body?.anonymous_id || req.body?.anonymousId, 120);
    const advertiserId = eventType === 'button_click'
      ? cleanText(req.body?.advertiser_id || req.body?.advertiserId, 80)
      : '';
    const advertiserName = eventType === 'button_click'
      ? cleanText(req.body?.advertiser_name || req.body?.advertiserName, 120)
      : '';
    const userAgent = cleanText(req.get('user-agent'), 500);

    await AppAnalytics.create({
      event_type: eventType,
      eventType,
      page,
      button_name: button,
      button,
      user_id: userId,
      userId,
      anonymous_id: anonymousId,
      anonymousId,
      advertiser_id: advertiserId,
      advertiserId,
      advertiser_name: advertiserName,
      advertiserName,
      user_agent: userAgent,
      userAgent,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('[Analytics] Falha ao registrar evento:', error.message);
    res.status(500).json({ message: 'Erro ao registrar evento.' });
  }
});

adminRouter.get('/summary', adminMiddleware, async (_req, res) => {
  try {
    res.json(await buildAnalyticsSummary());
  } catch (error) {
    console.error('[Analytics] Falha ao carregar resumo:', error.message);
    res.status(500).json({ message: 'Erro ao carregar estatisticas.' });
  }
});

module.exports = {
  publicRouter,
  adminRouter,
  buildAnalyticsSummary,
};
