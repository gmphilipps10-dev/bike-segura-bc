const express = require('express');
const jwt = require('jsonwebtoken');
const Pagamento = require('../models/Pagamento');
const User = require('../models/User');
const router = express.Router();

// ===== MIDDLEWARE =====
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token não fornecido.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ message: 'Acesso negado.' });
    next();
  } catch { res.status(401).json({ message: 'Token inválido.' }); }
};

// ===== ASAAS API =====
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_ENV = process.env.ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';

async function asaasRequest(endpoint, method = 'GET', body = null) {
  if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada');
  const res = await fetch(`${ASAAS_ENV}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
    body: body ? JSON.stringify(body) : null,
  });
  return res.json();
}

// ===== LISTAR PAGAMENTOS (admin) =====
router.get('/', adminAuth, async (req, res) => {
  try {
    const pagamentos = await Pagamento.find().sort({ createdAt: -1 });
    res.json(pagamentos);
  } catch { res.status(500).json({ message: 'Erro ao listar pagamentos.' }); }
});

// ===== ESTATÍSTICAS (admin) =====
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const todos = await Pagamento.find();
    const faturamentoTotal = todos.filter(p => p.status === 'pago').reduce((a, p) => a + p.valor, 0);
    const faturamentoPendente = todos.filter(p => p.status === 'pendente').reduce((a, p) => a + p.valor, 0);
    const faturamentoAtrasado = todos.filter(p => p.status === 'atrasado').reduce((a, p) => a + p.valor, 0);
    res.json({
      total: todos.length,
      pagos: todos.filter(p => p.status === 'pago').length,
      pendentes: todos.filter(p => p.status === 'pendente').length,
      atrasados: todos.filter(p => p.status === 'atrasado').length,
      cancelados: todos.filter(p => p.status === 'cancelado').length,
      faturamentoTotal,
      faturamentoPendente,
      faturamentoAtrasado,
    });
  } catch { res.status(500).json({ message: 'Erro.' }); }
});

// ===== CRIAR COBRANÇA NO ASAAS =====
router.post('/criar', adminAuth, async (req, res) => {
  try {
    const { userId, plano, valor, dataVencimento, metodoPagamento } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    if (!ASAAS_API_KEY) return res.status(500).json({ message: 'ASAAS_API_KEY não configurada. Configure a variável de ambiente.' });

    // 1. Criar ou buscar cliente no Asaas
    const clientesAsaas = await asaasRequest(`/customers?email=${encodeURIComponent(user.email)}`);
    let customerId;
    if (clientesAsaas.data && clientesAsaas.data.length > 0) {
      customerId = clientesAsaas.data[0].id;
    } else {
      const novoCliente = await asaasRequest('/customers', 'POST', {
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpfCnpj: user.cpf ? user.cpf.replace(/\D/g, '') : '',
      });
      customerId = novoCliente.id;
    }

    // 2. Criar cobrança no Asaas
    const cobranca = await asaasRequest('/payments', 'POST', {
      customer: customerId,
      billingType: metodoPagamento === 'pix' ? 'PIX' : metodoPagamento === 'boleto' ? 'BOLETO' : 'CREDIT_CARD',
      value: valor,
      dueDate: dataVencimento,
      description: `Bike Segura BC - Plano ${plano.toUpperCase()}`,
    });

    // 3. Se PIX, buscar QR Code
    let pixQrCode = '', pixPayload = '';
    if (metodoPagamento === 'pix' && cobranca.id) {
      try {
        const pixInfo = await asaasRequest(`/payments/${cobranca.id}/pixQrCode`);
        pixQrCode = pixInfo.encodedImage || '';
        pixPayload = pixInfo.payload || '';
      } catch { /* ignora erro do PIX */ }
    }

    // 4. Salvar no MongoDB
    const pagamento = new Pagamento({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userCpf: user.cpf,
      plano,
      valor: valor * 100, // centavos
      asaasId: cobranca.id,
      status: cobranca.status === 'CONFIRMED' ? 'pago' : 'pendente',
      metodoPagamento,
      dataVencimento: new Date(dataVencimento),
      linkPagamento: cobranca.invoiceUrl || '',
      pixQrCode,
      pixPayload,
      boletoUrl: cobranca.bankSlipUrl || '',
      historico: [{ status: 'pendente', descricao: 'Cobrança criada no Asaas' }],
    });
    await pagamento.save();

    res.json({ success: true, pagamento, linkPagamento: cobranca.invoiceUrl });
  } catch (error) {
    console.error('[Pagamento] Erro:', error);
    res.status(500).json({ message: 'Erro ao criar cobrança: ' + error.message });
  }
});

// ===== CANCELAR COBRANÇA =====
router.post('/:id/cancelar', adminAuth, async (req, res) => {
  try {
    const pag = await Pagamento.findById(req.params.id);
    if (!pag) return res.status(404).json({ message: 'Pagamento não encontrado.' });
    if (pag.asaasId && ASAAS_API_KEY) {
      await asaasRequest(`/payments/${pag.asaasId}/cancel`, 'POST', {});
    }
    pag.status = 'cancelado';
    pag.historico.push({ status: 'cancelado', descricao: 'Cobrança cancelada' });
    await pag.save();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ===== WEBHOOK DO ASAAS =====
router.post('/webhook', async (req, res) => {
  try {
    const { event, payment } = req.body;
    if (!payment || !payment.id) return res.status(200).json({ received: true });
    const pag = await Pagamento.findOne({ asaasId: payment.id });
    if (!pag) return res.status(200).json({ received: true });
    const statusMap = {
      'CONFIRMED': 'pago',
      'RECEIVED': 'pago',
      'OVERDUE': 'atrasado',
      'CANCELLED': 'cancelado',
    };
    const novoStatus = statusMap[event] || statusMap[payment.status] || pag.status;
    pag.status = novoStatus;
    if (novoStatus === 'pago') pag.dataPagamento = new Date();
    pag.historico.push({ status: novoStatus, descricao: `Webhook Asaas: ${event || payment.status}` });
    await pag.save();
    res.status(200).json({ received: true });
  } catch (error) { console.error('[Webhook] Erro:', error); res.status(200).json({ received: true }); }
});

module.exports = router;
