const express = require('express');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const Bike = require('../models/Bike');
const PrePrintedQR = require('../models/PrePrintedQR');
const Pagamento = require('../models/Pagamento');
const Sinistro = require('../models/Sinistro');

const router = express.Router();

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function maskEmail(email = '') {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return '';
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone = '') {
  const digits = onlyDigits(phone);
  if (digits.length < 8) return phone ? '***' : '';
  return `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`;
}

function maskCpf(cpf = '') {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return '';
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

function item({ type, title, subtitle, badge, route, id, icon = 'search' }) {
  return {
    id: String(id || `${type}-${title}`),
    type,
    title: title || 'Registro sem nome',
    subtitle: subtitle || '',
    badge: badge || '',
    route,
    icon,
  };
}

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ query: q, results: [] });

    const regex = new RegExp(escapeRegex(q), 'i');
    const digits = onlyDigits(q);
    const numericRegex = digits ? new RegExp(escapeRegex(digits)) : null;

    const [
      clientes,
      equipamentos,
      adesivos,
      pagamentos,
      sinistros,
    ] = await Promise.all([
      User.find({
        $or: [
          { name: regex },
          { email: regex },
          { phone: regex },
          { cpf: regex },
          ...(numericRegex ? [{ phone: numericRegex }, { cpf: numericRegex }] : []),
        ],
      }).select('name email phone cpf plano planoAtivo').limit(8).lean(),
      Bike.find({
        $or: [
          { name: regex },
          { brand: regex },
          { type: regex },
          { serie: regex },
          { color: regex },
        ],
      }).select('name brand type serie status planoAtivo stickerNumber').limit(8).lean(),
      PrePrintedQR.find({
        $or: [
          { stickerNumber: regex },
          { hash: regex },
          { 'ultimoVinculo.equipamentoNome': regex },
          { 'ultimoVinculo.equipamentoSerie': regex },
        ],
      }).select('stickerNumber status hash ultimoVinculo').limit(8).lean(),
      Pagamento.find({
        $or: [
          { userName: regex },
          { userEmail: regex },
          { bikeName: regex },
          { bikeBrand: regex },
          { bikeSerie: regex },
          { plano: regex },
          { asaasId: regex },
          ...(numericRegex ? [{ userCpf: numericRegex }] : []),
        ],
      }).select('userName userEmail bikeName bikeSerie plano status valor dataVencimento').sort({ createdAt: -1 }).limit(8).lean(),
      Sinistro.find({
        $or: [
          { tipo: regex },
          { status: regex },
          { 'veiculoSnapshot.nome': regex },
          { 'veiculoSnapshot.marca': regex },
          { 'veiculoSnapshot.serie': regex },
          { 'proprietarioSnapshot.nome': regex },
          { boletimOcorrencia: regex },
        ],
      }).select('tipo status statusRecuperacao veiculoSnapshot proprietarioSnapshot createdAt').sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const planos = ['bronze', 'prata', 'ouro', 'diamante']
      .filter(plano => regex.test(plano))
      .map(plano => item({
        type: 'plano',
        title: `Plano ${plano.charAt(0).toUpperCase()}${plano.slice(1)}`,
        subtitle: 'Configurar valores e assinantes',
        badge: 'Plano',
        route: `/planos?busca=${encodeURIComponent(plano)}`,
        id: plano,
        icon: 'plan',
      }));

    const results = [
      ...clientes.map(cliente => item({
        type: 'cliente',
        title: cliente.name,
        subtitle: [maskEmail(cliente.email), maskPhone(cliente.phone), maskCpf(cliente.cpf)].filter(Boolean).join(' • '),
        badge: cliente.planoAtivo ? `Plano ${cliente.plano}` : 'Sem plano ativo',
        route: `/clientes?busca=${encodeURIComponent(cliente.name || cliente.email || q)}&id=${cliente._id}`,
        id: cliente._id,
        icon: 'user',
      })),
      ...equipamentos.map(bike => item({
        type: 'equipamento',
        title: `${bike.brand || ''} ${bike.name || ''}`.trim(),
        subtitle: [bike.type, bike.serie ? `Serie ${bike.serie}` : '', bike.status].filter(Boolean).join(' • '),
        badge: bike.planoAtivo ? 'Plano ativo' : 'Sem plano',
        route: `/equipamentos?busca=${encodeURIComponent(bike.serie || bike.name || q)}&id=${bike._id}`,
        id: bike._id,
        icon: 'bike',
      })),
      ...adesivos.map(qr => item({
        type: 'adesivo',
        title: qr.stickerNumber,
        subtitle: qr.ultimoVinculo?.equipamentoNome || qr.hash,
        badge: qr.status,
        route: `/adesivos?busca=${encodeURIComponent(qr.stickerNumber)}&id=${qr._id}`,
        id: qr._id,
        icon: 'qr',
      })),
      ...planos,
      ...pagamentos.map(pagamento => item({
        type: 'pagamento',
        title: pagamento.userName || pagamento.userEmail,
        subtitle: [pagamento.bikeName, pagamento.bikeSerie, pagamento.plano].filter(Boolean).join(' • '),
        badge: pagamento.status,
        route: `/pagamentos?busca=${encodeURIComponent(pagamento.bikeSerie || pagamento.userName || q)}&id=${pagamento._id}`,
        id: pagamento._id,
        icon: 'payment',
      })),
      ...sinistros.map(sinistro => item({
        type: 'sinistro',
        title: sinistro.veiculoSnapshot?.nome || `Sinistro ${sinistro.tipo}`,
        subtitle: [sinistro.veiculoSnapshot?.serie, sinistro.proprietarioSnapshot?.nome, sinistro.statusRecuperacao].filter(Boolean).join(' • '),
        badge: sinistro.status,
        route: `/sinistros?busca=${encodeURIComponent(sinistro.veiculoSnapshot?.nome || sinistro.veiculoSnapshot?.serie || q)}&id=${sinistro._id}`,
        id: sinistro._id,
        icon: 'alert',
      })),
    ].slice(0, 30);

    res.json({ query: q, results });
  } catch (error) {
    console.error('[BuscaGlobal] Erro:', error);
    res.status(500).json({ message: 'Erro ao realizar pesquisa global.' });
  }
});

module.exports = router;
