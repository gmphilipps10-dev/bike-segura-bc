const express = require('express');
const mongoose = require('mongoose');
const adminMiddleware = require('../middleware/admin');
const PartnerStore = require('../models/PartnerStore');
const PartnerSale = require('../models/PartnerSale');
const {
  normalizarCodigoParceiro,
  buscarLojaAtivaPorCodigo,
  calcularComissao,
} = require('../utils/partnerSales');

const router = express.Router();

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function parseDate(value, fallback) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(Number(date)) ? date : fallback;
}

function centsToReais(value) {
  return Number(((Number(value) || 0) / 100).toFixed(2));
}

function maskEmail(email) {
  const value = String(email || '');
  const [name, domain] = value.split('@');
  if (!name || !domain) return value ? '***' : '';
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/(\d{2})(\d{0,5})(\d{0,4})/, (_m, ddd, mid, end) => `(${ddd}) ${mid ? `${mid.slice(0, 2)}***` : '***'}-${end || '****'}`);
}

function storePayload(body = {}) {
  return {
    nome_fantasia: String(body.nome_fantasia || '').trim(),
    razao_social: String(body.razao_social || '').trim(),
    cnpj: String(body.cnpj || '').trim(),
    responsavel: String(body.responsavel || '').trim(),
    telefone_whatsapp: String(body.telefone_whatsapp || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    endereco: String(body.endereco || '').trim(),
    cidade: String(body.cidade || 'Balneario Camboriu').trim(),
    codigo_parceiro: normalizarCodigoParceiro(body.codigo_parceiro || ''),
    percentual_comissao: Number(body.percentual_comissao ?? 10),
    status: body.status === 'inativa' ? 'inativa' : 'ativa',
  };
}

function monthRange(month) {
  if (/^\d{4}-\d{2}$/.test(String(month || ''))) {
    const [year, monthIndex] = String(month).split('-').map(Number);
    const start = new Date(year, monthIndex - 1, 1);
    return { start, end: startOfNextMonth(start) };
  }
  const now = new Date();
  return { start: startOfMonth(now), end: startOfNextMonth(now) };
}

async function gerarCodigoUnico(nome) {
  const base = normalizarCodigoParceiro(nome)
    .replace(/[^A-Z0-9]/g, '-')
    .slice(0, 18) || `LOJA-${Date.now().toString(36).toUpperCase()}`;

  let codigo = base;
  let tentativa = 1;
  while (await PartnerStore.exists({ codigo_parceiro: codigo })) {
    tentativa += 1;
    codigo = `${base}-${tentativa}`;
  }
  return codigo;
}

function buildSaleMatch(query = {}) {
  const match = {};
  const start = parseDate(query.from, null);
  const end = parseDate(query.to, null);
  if (start || end) {
    match.sold_at = {};
    if (start) match.sold_at.$gte = start;
    if (end) {
      const inclusiveEnd = new Date(end);
      inclusiveEnd.setHours(23, 59, 59, 999);
      match.sold_at.$lte = inclusiveEnd;
    }
  }
  if (query.storeId && mongoose.Types.ObjectId.isValid(query.storeId)) match.partner_store_id = query.storeId;
  if (query.codigo) match.codigo_parceiro = normalizarCodigoParceiro(query.codigo);
  if (query.plan) match.plan_id = String(query.plan);
  if (query.payment_status) match.payment_status = String(query.payment_status);
  if (query.commission_status) match.commission_status = String(query.commission_status);
  return match;
}

function formatStore(store) {
  return {
    id: store._id,
    nome_fantasia: store.nome_fantasia,
    razao_social: store.razao_social,
    cnpj: store.cnpj,
    responsavel: store.responsavel,
    telefone_whatsapp: store.telefone_whatsapp,
    telefone_whatsapp_mascarado: maskPhone(store.telefone_whatsapp),
    email: store.email,
    email_mascarado: maskEmail(store.email),
    endereco: store.endereco,
    cidade: store.cidade,
    codigo_parceiro: store.codigo_parceiro,
    percentual_comissao: store.percentual_comissao,
    status: store.status,
    link: `https://bikesegurabc.com.br/planos?loja=${store.codigo_parceiro}`,
    created_at: store.created_at,
    updated_at: store.updated_at,
  };
}

function formatSale(sale) {
  const store = sale.partner_store_id || {};
  const user = sale.user_id || {};
  const equipment = sale.equipment_id || {};
  return {
    id: sale._id,
    loja: store.nome_fantasia || 'Loja removida',
    partner_store_id: store._id || sale.partner_store_id,
    codigo_parceiro: sale.codigo_parceiro,
    cliente: user.name || 'Cliente',
    cliente_email_mascarado: maskEmail(user.email),
    cliente_telefone_mascarado: maskPhone(user.phone),
    equipamento: equipment.name || 'Equipamento',
    equipamento_serie: equipment.serie || '',
    plano: sale.plan_name,
    plan_id: sale.plan_id,
    valor_recebido: centsToReais(sale.net_amount || sale.gross_amount),
    valor_bruto: centsToReais(sale.gross_amount),
    valor_liquido: centsToReais(sale.net_amount),
    comissao: centsToReais(sale.commission_amount),
    commission_percentage: sale.commission_percentage,
    data: sale.sold_at,
    payment_status: sale.payment_status,
    sale_status: sale.sale_status,
    commission_status: sale.commission_status,
    paid_at: sale.paid_at,
    payment_observation: sale.payment_observation,
    payment_id: sale.payment_id,
    asaas_payment_id: sale.asaas_payment_id,
  };
}

router.get('/validar/:codigo', async (req, res) => {
  try {
    const loja = await buscarLojaAtivaPorCodigo(req.params.codigo);
    if (!loja) return res.status(404).json({ valid: false, message: 'Loja parceira nao encontrada ou inativa.' });
    res.json({
      valid: true,
      codigo_parceiro: loja.codigo_parceiro,
      nome_fantasia: loja.nome_fantasia,
      expires_in_days: 30,
    });
  } catch {
    res.status(500).json({ valid: false, message: 'Erro ao validar loja parceira.' });
  }
});

router.use(adminMiddleware);

router.get('/', async (_req, res) => {
  try {
    const lojas = await PartnerStore.find().sort({ created_at: -1 });
    res.json(lojas.map(formatStore));
  } catch {
    res.status(500).json({ message: 'Erro ao listar lojas parceiras.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = storePayload(req.body);
    if (!payload.nome_fantasia) return res.status(400).json({ message: 'Informe o nome fantasia da loja.' });
    if (!payload.codigo_parceiro) payload.codigo_parceiro = await gerarCodigoUnico(payload.nome_fantasia);
    const loja = await PartnerStore.create(payload);
    res.status(201).json(formatStore(loja));
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'Codigo de parceiro ja cadastrado.' });
    res.status(400).json({ message: error.message || 'Erro ao cadastrar loja parceira.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = storePayload(req.body);
    if (!payload.nome_fantasia) return res.status(400).json({ message: 'Informe o nome fantasia da loja.' });
    if (!payload.codigo_parceiro) payload.codigo_parceiro = await gerarCodigoUnico(payload.nome_fantasia);
    const loja = await PartnerStore.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!loja) return res.status(404).json({ message: 'Loja parceira nao encontrada.' });
    res.json(formatStore(loja));
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'Codigo de parceiro ja cadastrado.' });
    res.status(400).json({ message: error.message || 'Erro ao atualizar loja parceira.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Loja parceira invalida.' });
    }

    const vendas = await PartnerSale.countDocuments({ partner_store_id: req.params.id });
    if (vendas > 0) {
      return res.status(409).json({
        message: 'Esta loja possui vendas vinculadas. Zere os dados de teste ou mantenha a loja inativa para preservar o historico.',
      });
    }

    const loja = await PartnerStore.findByIdAndDelete(req.params.id);
    if (!loja) return res.status(404).json({ message: 'Loja parceira nao encontrada.' });

    res.json({ success: true, message: 'Loja parceira excluida.' });
  } catch {
    res.status(500).json({ message: 'Erro ao excluir loja parceira.' });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const match = buildSaleMatch(req.query);
    const sales = await PartnerSale.find(match)
      .populate('partner_store_id', 'nome_fantasia codigo_parceiro')
      .populate('user_id', 'name email phone')
      .populate('equipment_id', 'name brand serie')
      .sort({ sold_at: -1 })
      .limit(500);
    res.json({ items: sales.map(formatSale), total: sales.length });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erro ao listar vendas por loja.' });
  }
});

router.get('/commissions/summary', async (req, res) => {
  try {
    const match = buildSaleMatch(req.query);
    const sales = await PartnerSale.find(match)
      .populate('partner_store_id', 'nome_fantasia codigo_parceiro')
      .lean();

    const confirmed = sales.filter(sale => sale.sale_status === 'confirmed');
    const totalVendido = confirmed.reduce((sum, sale) => sum + Number(sale.net_amount || sale.gross_amount || 0), 0);
    const totalPendente = confirmed
      .filter(sale => sale.commission_status === 'pending')
      .reduce((sum, sale) => sum + Number(sale.commission_amount || 0), 0);
    const totalPago = confirmed
      .filter(sale => sale.commission_status === 'paid')
      .reduce((sum, sale) => sum + Number(sale.commission_amount || 0), 0);

    const byStore = new Map();
    confirmed.forEach(sale => {
      const key = String(sale.partner_store_id?._id || sale.partner_store_id);
      const current = byStore.get(key) || {
        loja: sale.partner_store_id?.nome_fantasia || 'Loja removida',
        codigo_parceiro: sale.codigo_parceiro,
        quantidade: 0,
        vendido: 0,
        comissao_pendente: 0,
        comissao_paga: 0,
      };
      current.quantidade += 1;
      current.vendido += Number(sale.net_amount || sale.gross_amount || 0);
      if (sale.commission_status === 'pending') current.comissao_pendente += Number(sale.commission_amount || 0);
      if (sale.commission_status === 'paid') current.comissao_paga += Number(sale.commission_amount || 0);
      byStore.set(key, current);
    });

    res.json({
      total_vendido: centsToReais(totalVendido),
      total_comissao_pendente: centsToReais(totalPendente),
      total_comissao_paga: centsToReais(totalPago),
      comissao_por_loja: Array.from(byStore.values()).map(item => ({
        ...item,
        vendido: centsToReais(item.vendido),
        comissao_pendente: centsToReais(item.comissao_pendente),
        comissao_paga: centsToReais(item.comissao_paga),
      })).sort((a, b) => b.vendido - a.vendido),
    });
  } catch {
    res.status(500).json({ message: 'Erro ao carregar resumo de comissoes.' });
  }
});

router.post('/sales/:id/commission/paid', async (req, res) => {
  try {
    const sale = await PartnerSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Venda nao encontrada.' });
    if (sale.sale_status !== 'confirmed') return res.status(400).json({ message: 'Apenas vendas confirmadas podem ter comissao paga.' });

    sale.commission_status = 'paid';
    sale.paid_at = new Date();
    sale.paid_by = req.userId || 'painel-admin';
    sale.paid_by_name = req.user?.name || req.user?.email || (req.isPainelAdmin ? 'Painel Admin' : 'Admin');
    sale.payment_observation = String(req.body?.payment_observation || '').trim();
    await sale.save();
    res.json({ success: true, sale: formatSale(await sale.populate('partner_store_id user_id equipment_id')) });
  } catch {
    res.status(500).json({ message: 'Erro ao marcar comissao como paga.' });
  }
});

router.put('/sales/:id/store', async (req, res) => {
  try {
    const sale = await PartnerSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Venda nao encontrada.' });
    if (sale.commission_status === 'paid') return res.status(400).json({ message: 'Comissao ja paga. Estorne manualmente antes de alterar a loja.' });

    const loja = req.body?.partner_store_id && mongoose.Types.ObjectId.isValid(req.body.partner_store_id)
      ? await PartnerStore.findById(req.body.partner_store_id)
      : await buscarLojaAtivaPorCodigo(req.body?.codigo_parceiro);
    if (!loja) return res.status(404).json({ message: 'Loja parceira nao encontrada.' });

    const oldStoreId = sale.partner_store_id;
    const oldCodigo = sale.codigo_parceiro;
    sale.partner_store_id = loja._id;
    sale.codigo_parceiro = loja.codigo_parceiro;
    sale.commission_percentage = Number(loja.percentual_comissao || 10);
    sale.commission_amount = calcularComissao({
      grossAmount: sale.gross_amount,
      netAmount: sale.net_amount,
      percentage: sale.commission_percentage,
    });
    sale.manual_change_logs.push({
      changed_by: req.userId || 'painel-admin',
      changed_by_name: req.user?.name || req.user?.email || (req.isPainelAdmin ? 'Painel Admin' : 'Admin'),
      from_partner_store_id: oldStoreId,
      from_codigo_parceiro: oldCodigo,
      to_partner_store_id: loja._id,
      to_codigo_parceiro: loja.codigo_parceiro,
      observation: String(req.body?.observation || '').trim(),
    });
    await sale.save();
    res.json({ success: true, sale: formatSale(await sale.populate('partner_store_id user_id equipment_id')) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erro ao alterar loja vinculada.' });
  }
});

router.get('/reports/monthly', async (req, res) => {
  try {
    const { start, end } = monthRange(req.query.month);
    const match = {
      ...buildSaleMatch({ ...req.query, from: start.toISOString(), to: new Date(end.getTime() - 1).toISOString() }),
      sale_status: 'confirmed',
    };

    const sales = await PartnerSale.find(match)
      .populate('partner_store_id', 'nome_fantasia codigo_parceiro')
      .lean();
    const stores = new Map();

    sales.forEach(sale => {
      const key = String(sale.partner_store_id?._id || sale.partner_store_id);
      const current = stores.get(key) || {
        nome_loja: sale.partner_store_id?.nome_fantasia || 'Loja removida',
        codigo_parceiro: sale.codigo_parceiro,
        quantidade_vendas: 0,
        vendas_por_plano: {},
        valor_total_vendido: 0,
        comissao_total: 0,
        comissoes_pagas: 0,
        saldo_pendente: 0,
      };
      current.quantidade_vendas += 1;
      current.vendas_por_plano[sale.plan_name] = (current.vendas_por_plano[sale.plan_name] || 0) + 1;
      current.valor_total_vendido += Number(sale.net_amount || sale.gross_amount || 0);
      current.comissao_total += Number(sale.commission_amount || 0);
      if (sale.commission_status === 'paid') current.comissoes_pagas += Number(sale.commission_amount || 0);
      if (sale.commission_status === 'pending') current.saldo_pendente += Number(sale.commission_amount || 0);
      stores.set(key, current);
    });

    res.json({
      periodo: {
        inicio: start,
        fim: new Date(end.getTime() - 1),
      },
      rows: Array.from(stores.values()).map(item => ({
        ...item,
        vendas_por_plano: Object.entries(item.vendas_por_plano)
          .map(([plano, quantidade]) => `${plano}: ${quantidade}`)
          .join(' | '),
        valor_total_vendido: centsToReais(item.valor_total_vendido),
        comissao_total: centsToReais(item.comissao_total),
        comissoes_pagas: centsToReais(item.comissoes_pagas),
        saldo_pendente: centsToReais(item.saldo_pendente),
      })),
    });
  } catch {
    res.status(500).json({ message: 'Erro ao gerar relatorio mensal.' });
  }
});

module.exports = router;
