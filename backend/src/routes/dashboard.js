const express = require('express');
const mongoose = require('mongoose');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const Bike = require('../models/Bike');
const Pagamento = require('../models/Pagamento');
const PrePrintedQR = require('../models/PrePrintedQR');
const Sinistro = require('../models/Sinistro');
const { buildAnalyticsSummary } = require('./analytics');

const router = express.Router();

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function centsToReais(value) {
  return Number(((Number(value) || 0) / 100).toFixed(2));
}

function percent(part, total) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

function safeDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(Number(date)) ? date : null;
}

function eventDate(value) {
  return safeDate(value)?.toISOString() || new Date(0).toISOString();
}

async function sumPaidPaymentsSince(startDate) {
  const result = await Pagamento.aggregate([
    {
      $match: {
        status: 'pago',
        dataPagamento: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$valor' },
      },
    },
  ]);

  return result[0]?.total || 0;
}

async function buildReferralStats() {
  const users = await User.find()
    .select('name indicacoes')
    .populate('indicacoes', 'planoAtivo plano')
    .lean();

  let totalIndicacoes = 0;
  let indicacoesConvertidas = 0;

  const ranking = users
    .map(user => {
      const indicacoes = Array.isArray(user.indicacoes) ? user.indicacoes : [];
      const convertidas = indicacoes.filter(indicado => indicado?.planoAtivo || indicado?.plano !== 'free').length;
      totalIndicacoes += indicacoes.length;
      indicacoesConvertidas += convertidas;

      return {
        usuario: String(user.name || 'Usuario').split(' ')[0],
        total: indicacoes.length,
        convertidas,
        descontoAcumulado: Math.min(100, indicacoes.length * 10),
      };
    })
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total || b.convertidas - a.convertidas)
    .slice(0, 5);

  return {
    totalIndicacoes,
    indicacoesConvertidas,
    ranking,
  };
}

async function buildRecentActivity() {
  const [users, bikes, pagamentos, sinistros, recuperados, qrs] = await Promise.all([
    User.find().select('createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    Bike.find().select('name brand createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    Pagamento.find({ status: 'pago' }).select('plano valor dataPagamento updatedAt').sort({ dataPagamento: -1, updatedAt: -1 }).limit(5).lean(),
    Sinistro.find({ tipo: { $in: ['furto', 'roubo'] } }).select('tipo createdAt dataOcorrencia').sort({ createdAt: -1 }).limit(5).lean(),
    Sinistro.find({ statusRecuperacao: 'recuperado' }).select('dataFechamento dataAtualizacao updatedAt').sort({ dataAtualizacao: -1, updatedAt: -1 }).limit(5).lean(),
    PrePrintedQR.find({ status: 'vinculado' }).select('stickerNumber vinculadoAt updatedAt').sort({ vinculadoAt: -1, updatedAt: -1 }).limit(5).lean(),
  ]);

  return [
    ...users.map(item => ({
      type: 'cliente',
      title: 'Novo cliente cadastrado',
      description: 'Cadastro criado no aplicativo',
      date: eventDate(item.createdAt),
    })),
    ...bikes.map(item => ({
      type: 'equipamento',
      title: 'Novo equipamento cadastrado',
      description: `${item.brand || 'Equipamento'} ${item.name || ''}`.trim(),
      date: eventDate(item.createdAt),
    })),
    ...pagamentos.map(item => ({
      type: 'pagamento',
      title: 'Pagamento confirmado',
      description: `Plano ${String(item.plano || '').toUpperCase()} confirmado`,
      date: eventDate(item.dataPagamento || item.updatedAt),
    })),
    ...sinistros.map(item => ({
      type: 'sinistro',
      title: 'Novo alerta de furto',
      description: `Ocorrencia de ${item.tipo || 'furto'} registrada`,
      date: eventDate(item.createdAt || item.dataOcorrencia),
    })),
    ...recuperados.map(item => ({
      type: 'recuperacao',
      title: 'Equipamento recuperado',
      description: 'Sinistro marcado como recuperado',
      date: eventDate(item.dataFechamento || item.dataAtualizacao || item.updatedAt),
    })),
    ...qrs.map(item => ({
      type: 'qr',
      title: 'QR Code ativado',
      description: `${item.stickerNumber || 'Adesivo'} vinculado a um equipamento`,
      date: eventDate(item.vinculadoAt || item.updatedAt),
    })),
  ]
    .sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)))
    .slice(0, 12);
}

router.get('/summary', adminMiddleware, async (_req, res) => {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);
    const todayStart = startOfDay(now);
    const next15Days = addDays(now, 15);

    const [
      totalClientes,
      totalEquipamentos,
      assinaturasAtivas,
      alertasFurto,
      equipamentosRecuperados,
      receitaMesCentavos,
      receitaAnoCentavos,
      pagamentosPendentes,
      pagamentosVencidos,
      assinaturasCanceladas,
      adesivosDisponiveis,
      adesivosInativos,
      usuariosComEquipamento,
      equipamentosSemPlanoAtivo,
      assinaturasProximasVencimento,
      analytics,
      indicacoes,
      sinistrosTotal,
      sinistrosAbertos,
      sinistrosRecuperados,
      tempoRecuperacaoAgg,
      novosCadastros30,
      equipamentos30,
      assinaturas30,
      atividadeRecente,
    ] = await Promise.all([
      User.countDocuments(),
      Bike.countDocuments(),
      Bike.countDocuments({
        planoAtivo: true,
        $or: [{ planoDataExpiracao: null }, { planoDataExpiracao: { $gt: now } }],
      }),
      Bike.countDocuments({ status: 'furto' }),
      Bike.countDocuments({ status: 'recuperada' }),
      sumPaidPaymentsSince(monthStart),
      sumPaidPaymentsSince(yearStart),
      Pagamento.countDocuments({ status: 'pendente' }),
      Pagamento.countDocuments({
        $or: [
          { status: 'atrasado' },
          { status: 'pendente', dataVencimento: { $lt: todayStart } },
        ],
      }),
      Pagamento.countDocuments({ status: 'cancelado' }),
      PrePrintedQR.countDocuments({ status: 'disponivel' }),
      PrePrintedQR.countDocuments({ status: 'inativo' }),
      Bike.distinct('userId'),
      Bike.countDocuments({
        $or: [
          { planoAtivo: { $ne: true } },
          { plano: 'free' },
          { planoDataExpiracao: { $ne: null, $lte: now } },
        ],
      }),
      Bike.countDocuments({
        planoAtivo: true,
        planoDataExpiracao: { $ne: null, $gt: now, $lte: next15Days },
      }),
      buildAnalyticsSummary(),
      buildReferralStats(),
      Sinistro.countDocuments({ tipo: { $in: ['furto', 'roubo'] } }),
      Sinistro.countDocuments({ status: 'aberto' }),
      Sinistro.countDocuments({ statusRecuperacao: 'recuperado' }),
      Sinistro.aggregate([
        {
          $match: {
            statusRecuperacao: 'recuperado',
            dataOcorrencia: { $ne: null },
            $or: [{ dataFechamento: { $ne: null } }, { dataAtualizacao: { $ne: null } }],
          },
        },
        {
          $project: {
            horas: {
              $divide: [
                { $subtract: [{ $ifNull: ['$dataFechamento', '$dataAtualizacao'] }, '$dataOcorrencia'] },
                1000 * 60 * 60,
              ],
            },
          },
        },
        { $match: { horas: { $gte: 0 } } },
        { $group: { _id: null, mediaHoras: { $avg: '$horas' } } },
      ]),
      User.countDocuments({ createdAt: { $gte: addDays(now, -30) } }),
      Bike.countDocuments({ createdAt: { $gte: addDays(now, -30) } }),
      Pagamento.countDocuments({ status: 'pago', dataPagamento: { $gte: addDays(now, -30) } }),
      buildRecentActivity(),
    ]);

    const visitantes = analytics.usuariosUnicos || analytics.acessosUltimos30Dias || 0;
    const clientesSemEquipamento = Math.max(0, totalClientes - usuariosComEquipamento.length);
    const taxaConversao = percent(assinaturas30 || assinaturasAtivas, visitantes || totalClientes);
    const taxaRecuperacao = percent(sinistrosRecuperados, sinistrosTotal);

    res.json({
      resumoPrincipal: {
        clientesTotais: totalClientes,
        equipamentosCadastrados: totalEquipamentos,
        assinaturasAtivas,
        receitaMensal: centsToReais(receitaMesCentavos),
        alertasFurto,
        equipamentosRecuperados,
      },
      analytics,
      funilComercial: {
        visitantes,
        cadastros: novosCadastros30,
        equipamentosCadastrados: equipamentos30,
        assinaturasRealizadas: assinaturas30,
        taxaConversao,
      },
      financeiro: {
        receitaMes: centsToReais(receitaMesCentavos),
        receitaAno: centsToReais(receitaAnoCentavos),
        pagamentosPendentes,
        pagamentosVencidos,
        assinaturasAtivas,
        assinaturasCanceladas,
      },
      atividadeRecente,
      alertasAdministrativos: {
        clientesSemEquipamento,
        equipamentosSemPlanoAtivo,
        pagamentosVencidos,
        assinaturasProximasVencimento,
        adesivosQrLivres: adesivosDisponiveis,
        adesivosQrInativos: adesivosInativos,
      },
      indicacoes,
      sinistros: {
        alertasFurtoEmitidos: sinistrosTotal,
        alertasEmAberto: sinistrosAbertos,
        equipamentosRecuperados: sinistrosRecuperados,
        taxaRecuperacao,
        tempoMedioRecuperacaoHoras: Number((tempoRecuperacaoAgg[0]?.mediaHoras || 0).toFixed(1)),
      },
      statusSistema: {
        api: 'online',
        mongodb: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado',
        armazenamentoImagens: 'operacional',
        whatsapp: 'manual',
        ultimaAtualizacao: new Date().toISOString(),
      },
      relatorios: [
        'clientes',
        'equipamentos',
        'pagamentos',
        'alertas_de_furto',
        'adesivos_qr',
        'analytics',
      ],
      lgpd: {
        analyticsSemDadosSensiveis: true,
        observacao: 'Dashboard usa indicadores agregados. CPF, telefone, endereco completo e localizacao precisa nao sao exibidos aqui.',
      },
    });
  } catch (error) {
    console.error('[Dashboard] Erro ao carregar resumo:', error);
    res.status(500).json({ message: 'Erro ao carregar o dashboard operacional.' });
  }
});

module.exports = router;
