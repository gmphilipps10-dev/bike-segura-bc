const express = require('express');
const jwt = require('jsonwebtoken');
const Pagamento = require('../models/Pagamento');
const User = require('../models/User');
const Bike = require('../models/Bike');
const adminMiddleware = require('../middleware/admin');
const {
  centavosParaReais,
  getPlanoValorCentavos,
  getPrecosCentavos,
  salvarPrecos,
} = require('../utils/planoConfig');
const {
  asaasRequest,
  cancelarCobrancaAsaas,
  getAsaasApiKey,
} = require('../utils/asaas');

const router = express.Router();
const PLANOS_ORDEM = ['free', 'bronze', 'prata', 'ouro', 'diamante'];
const FREQUENCIAS = ['mensal', 'anual'];
const METODOS = ['pix', 'boleto', 'cartao'];
const STATUS_ATIVOS = ['pendente', 'pago', 'atrasado'];

const userAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token nao fornecido.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalido.' });
  }
};

function adicionarMeses(data, meses) {
  const resultado = new Date(data);
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
}

function adicionarAnos(data, anos) {
  const resultado = new Date(data);
  resultado.setFullYear(resultado.getFullYear() + anos);
  return resultado;
}

function dataAsaas(data) {
  return new Date(data).toISOString().split('T')[0];
}

function billingType(metodo) {
  if (metodo === 'pix') return 'PIX';
  if (metodo === 'boleto') return 'BOLETO';
  return 'CREDIT_CARD';
}

function respostaPagamento(pagamento, cobranca = null) {
  return {
    id: pagamento._id,
    plano: pagamento.plano,
    bikeId: pagamento.bikeId,
    bikeName: pagamento.bikeName,
    bikeBrand: pagamento.bikeBrand,
    bikeSerie: pagamento.bikeSerie,
    frequencia: pagamento.frequencia,
    valor: pagamento.valor,
    valorMensal: pagamento.valorMensal,
    valorTotal: pagamento.valorTotal,
    status: pagamento.status,
    linkPagamento: cobranca?.invoiceUrl || pagamento.linkPagamento || '',
    pixQrCode: pagamento.pixQrCode || '',
    pixPayload: pagamento.pixPayload || '',
    boletoUrl: cobranca?.bankSlipUrl || pagamento.boletoUrl || '',
    dataVencimento: pagamento.dataVencimento,
  };
}

async function atualizarPlanoUsuario(userId) {
  const agora = new Date();
  const bikesAtivas = await Bike.find({
    userId,
    planoAtivo: true,
    $or: [
      { planoDataExpiracao: null },
      { planoDataExpiracao: { $gt: agora } },
    ],
  }).select('plano planoDataAtivacao planoDataExpiracao');

  if (!bikesAtivas.length) {
    await User.findByIdAndUpdate(userId, {
      plano: 'free',
      planoAtivo: false,
      planoDataAtivacao: null,
      planoDataExpiracao: null,
    });
    return;
  }

  const melhorPlano = bikesAtivas.reduce((melhor, bike) => (
    PLANOS_ORDEM.indexOf(bike.plano) > PLANOS_ORDEM.indexOf(melhor) ? bike.plano : melhor
  ), 'free');
  const ativacoes = bikesAtivas.map(bike => bike.planoDataAtivacao).filter(Boolean);
  const expiracoes = bikesAtivas.map(bike => bike.planoDataExpiracao).filter(Boolean);

  await User.findByIdAndUpdate(userId, {
    plano: melhorPlano,
    planoAtivo: true,
    planoDataAtivacao: ativacoes.length ? new Date(Math.min(...ativacoes.map(Number))) : new Date(),
    planoDataExpiracao: expiracoes.length ? new Date(Math.max(...expiracoes.map(Number))) : null,
  });
}

async function buscarOuCriarClienteAsaas(user) {
  const clientes = await asaasRequest(`/customers?email=${encodeURIComponent(user.email)}`);
  if (clientes.data?.[0]?.id) return clientes.data[0].id;

  const novoCliente = await asaasRequest('/customers', 'POST', {
    name: user.name,
    email: user.email,
    phone: user.phone,
    cpfCnpj: user.cpf ? user.cpf.replace(/\D/g, '') : '',
  });
  if (!novoCliente.id) throw new Error('O Asaas nao retornou o cliente criado.');
  return novoCliente.id;
}

async function buscarPrimeiraCobrancaAssinatura(subscriptionId) {
  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    const resposta = await asaasRequest(`/subscriptions/${subscriptionId}/payments`);
    if (resposta.data?.[0]) return resposta.data[0];
    await new Promise(resolve => setTimeout(resolve, 250 * (tentativa + 1)));
  }
  return null;
}

async function obterCobrancaAtiva(bike) {
  if (bike.planoAtivo && bike.planoDataExpiracao && bike.planoDataExpiracao <= new Date()) {
    bike.planoAtivo = false;
    bike.pagamentoAtualId = null;
    await bike.save();
    await Pagamento.updateMany(
      { bikeId: bike._id, cobrancaAtiva: true, frequencia: 'anual' },
      { $set: { cobrancaAtiva: false } }
    );
  }

  return Pagamento.findOne({
    bikeId: bike._id,
    cobrancaAtiva: true,
    status: { $in: STATUS_ATIVOS },
  }).sort({ createdAt: -1 });
}

async function criarCobranca({ user, bike, plano, metodoPagamento, frequencia, dataVencimento }) {
  if (!getAsaasApiKey()) throw new Error('ASAAS_API_KEY nao configurada.');
  if (!FREQUENCIAS.includes(frequencia)) throw new Error('Escolha pagamento mensal ou anual.');
  if (!METODOS.includes(metodoPagamento)) throw new Error('Forma de pagamento invalida.');

  const valorMensal = await getPlanoValorCentavos(plano);
  if (!valorMensal) throw new Error('Plano invalido.');

  const existente = await obterCobrancaAtiva(bike);
  if (existente) {
    return {
      pagamento: existente,
      reutilizada: true,
    };
  }

  const valorTotal = valorMensal * 12;
  const valorCobrado = frequencia === 'mensal' ? valorMensal : valorTotal;
  const vencimento = dataVencimento ? new Date(dataVencimento) : new Date();
  if (!dataVencimento) vencimento.setDate(vencimento.getDate() + 3);
  const externalReference = `bike-${bike._id}-${Date.now()}`;

  let pagamento;
  try {
    pagamento = await Pagamento.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userCpf: user.cpf,
      bikeId: bike._id,
      bikeName: bike.name,
      bikeBrand: bike.brand,
      bikeSerie: bike.serie,
      plano,
      valor: valorCobrado,
      valorMensal,
      valorTotal,
      frequencia,
      quantidadeCobrancas: frequencia === 'mensal' ? 12 : 1,
      cobrancaAtiva: true,
      status: 'pendente',
      metodoPagamento,
      dataVencimento: vencimento,
      externalReference,
      historico: [{
        status: 'pendente',
        descricao: `Contratacao ${frequencia} reservada para o equipamento ${bike.name}`,
      }],
    });
  } catch (error) {
    if (error?.code === 11000) {
      const concorrente = await obterCobrancaAtiva(bike);
      if (concorrente) return { pagamento: concorrente, reutilizada: true };
    }
    throw error;
  }

  try {
    const customerId = await buscarOuCriarClienteAsaas(user);
    let cobranca;

    if (frequencia === 'mensal') {
      const assinatura = await asaasRequest('/subscriptions', 'POST', {
        customer: customerId,
        billingType: billingType(metodoPagamento),
        value: valorMensal / 100,
        nextDueDate: dataAsaas(vencimento),
        cycle: 'MONTHLY',
        description: `Bike Segura BC - ${plano.toUpperCase()} - ${bike.name}`,
        externalReference,
      });
      pagamento.asaasSubscriptionId = assinatura.id || '';
      cobranca = assinatura.id ? await buscarPrimeiraCobrancaAssinatura(assinatura.id) : null;
    } else {
      cobranca = await asaasRequest('/payments', 'POST', {
        customer: customerId,
        billingType: billingType(metodoPagamento),
        value: valorTotal / 100,
        dueDate: dataAsaas(vencimento),
        description: `Bike Segura BC - ${plano.toUpperCase()} anual - ${bike.name}`,
        externalReference,
      });
    }

    if (!cobranca?.id) {
      throw new Error('O Asaas nao retornou a primeira cobranca.');
    }

    pagamento.asaasId = cobranca.id;
    let pixQrCode = '';
    let pixPayload = '';
    if (metodoPagamento === 'pix') {
      const pixInfo = await asaasRequest(`/payments/${cobranca.id}/pixQrCode`);
      pixQrCode = pixInfo.encodedImage || '';
      pixPayload = pixInfo.payload || '';
    }

    pagamento.status = ['CONFIRMED', 'RECEIVED'].includes(cobranca.status) ? 'pago' : 'pendente';
    pagamento.linkPagamento = cobranca.invoiceUrl || '';
    pagamento.pixQrCode = pixQrCode;
    pagamento.pixPayload = pixPayload;
    pagamento.boletoUrl = cobranca.bankSlipUrl || '';
    pagamento.historico.push({
      status: pagamento.status,
      descricao: frequencia === 'mensal'
        ? 'Assinatura mensal criada no Asaas'
        : 'Cobranca anual criada no Asaas',
    });
    await pagamento.save();

    bike.pagamentoAtualId = pagamento._id;
    await bike.save();

    return { pagamento, cobranca, reutilizada: false };
  } catch (error) {
    try {
      console.log(`[Admin] Excluindo cobranca ${pagamento._id} (${pagamento.asaasId}) por motivo: ${motivo.trim()}`);
    await cancelarCobrancaAsaas(pagamento);
    } catch (cancelError) {
      console.error('[Pagamento] Falha ao desfazer cobranca incompleta:', cancelError.message);
    }
    pagamento.cobrancaAtiva = false;
    pagamento.status = 'cancelado';
    pagamento.historico.push({ status: 'cancelado', descricao: `Falha ao criar no Asaas: ${error.message}` });
    await pagamento.save();
    throw error;
  }
}

router.get('/status', adminMiddleware, async (_req, res) => {
  res.json({
    asaas_configurado: !!getAsaasApiKey(),
    asaas_env: process.env.ASAAS_ENV === 'production' ? 'producao' : 'sandbox',
    mensagem: getAsaasApiKey()
      ? 'ASAAS_API_KEY configurada corretamente'
      : 'ASAAS_API_KEY nao encontrada.',
  });
});

router.get('/planos', async (_req, res) => {
  try {
    const precosCentavos = await getPrecosCentavos();
    res.json({
      precos: centavosParaReais(precosCentavos),
      periodicidade: 'mensal',
    });
  } catch {
    res.status(500).json({ message: 'Erro ao carregar os precos dos planos.' });
  }
});

router.put('/planos', adminMiddleware, async (req, res) => {
  try {
    const precos = await salvarPrecos(req.body?.precos);
    res.json({ success: true, precos, periodicidade: 'mensal' });
  } catch (error) {
    const validacao = error.message?.startsWith('O valor') || error.message?.startsWith('Informe');
    res.status(validacao ? 400 : 500).json({
      message: validacao ? error.message : 'Erro ao salvar os precos dos planos.',
    });
  }
});

router.get('/', adminMiddleware, async (_req, res) => {
  try {
    const pagamentos = await Pagamento.find().sort({ createdAt: -1 });
    res.json(pagamentos);
  } catch {
    res.status(500).json({ message: 'Erro ao listar pagamentos.' });
  }
});

router.get('/stats', adminMiddleware, async (_req, res) => {
  try {
    const todos = await Pagamento.find();
    const soma = status => todos
      .filter(pagamento => pagamento.status === status)
      .reduce((total, pagamento) => total + pagamento.valor, 0);
    res.json({
      total: todos.length,
      pagos: todos.filter(p => p.status === 'pago').length,
      pendentes: todos.filter(p => p.status === 'pendente').length,
      atrasados: todos.filter(p => p.status === 'atrasado').length,
      cancelados: todos.filter(p => p.status === 'cancelado').length,
      faturamentoTotal: soma('pago'),
      faturamentoPendente: soma('pendente'),
      faturamentoAtrasado: soma('atrasado'),
    });
  } catch {
    res.status(500).json({ message: 'Erro ao carregar estatisticas.' });
  }
});

router.post('/criar', adminMiddleware, async (req, res) => {
  try {
    const {
      userId,
      bikeId,
      plano,
      dataVencimento,
      metodoPagamento,
      frequencia = 'mensal',
    } = req.body;
    if (!bikeId) return res.status(400).json({ message: 'Selecione um equipamento para gerar a cobranca.' });

    const [user, bike] = await Promise.all([
      User.findById(userId),
      Bike.findOne({ _id: bikeId, userId }),
    ]);
    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado.' });
    if (!bike) return res.status(404).json({ message: 'Equipamento nao encontrado para este usuario.' });

    const resultado = await criarCobranca({
      user,
      bike,
      plano,
      metodoPagamento,
      frequencia,
      dataVencimento,
    });
    res.json({
      success: true,
      reused: resultado.reutilizada,
      pagamento: respostaPagamento(resultado.pagamento, resultado.cobranca),
      mensagem: resultado.reutilizada
        ? 'Este equipamento ja possui uma cobranca ativa.'
        : 'Cobranca vinculada ao equipamento com sucesso.',
    });
  } catch (error) {
    console.error('[Pagamento admin] Erro:', error);
    res.status(400).json({ message: error.message || 'Erro ao criar cobranca.' });
  }
});

router.post('/:id/cancelar', adminMiddleware, async (req, res) => {
  try {
    console.log('[Admin] Tentando excluir pagamento:', req.params.id);
    const pagamento = await Pagamento.findById(req.params.id);
    if (!pagamento) return res.status(404).json({ message: 'Pagamento não encontrado.' });
    
    if (pagamento.status !== 'pendente') {
      return res.status(400).json({
        message: `Não é possível excluir cobranças com status "${pagamento.status}". Apenas cobranças PENDENTES podem ser excluídas.`,
      });
    }

    const { motivo } = req.body || {};
    if (!motivo || motivo.trim().length < 5) {
      return res.status(400).json({ message: 'Informe um motivo com pelo menos 5 caracteres para a exclusão.' });
    }

    // Tentar cancelar no Asaas, mas não travar se der erro
    try {
      if (pagamento.asaasId || pagamento.asaasSubscriptionId) {
        await cancelarCobrancaAsaas(pagamento);
      }
    } catch (asaasError) {
      console.error('[Admin] Erro Asaas:', asaasError.message);
    }

    const adminNome = req.user?.name || req.user?.email || 'Admin';
    const agora = new Date();

    pagamento.status = 'cancelado';
    pagamento.cobrancaAtiva = false;
    pagamento.excluidoPor = req.userId;
    pagamento.excluidoPorNome = adminNome;
    pagamento.dataExclusao = agora;
    pagamento.motivoExclusao = motivo.trim();
    pagamento.historico.push({
      status: 'cancelado',
      descricao: `Cobrança excluída por ${adminNome}. Motivo: ${motivo.trim()}`,
    });

    await pagamento.save();

    if (pagamento.bikeId) {
      await Bike.findByIdAndUpdate(pagamento.bikeId, { pagamentoAtualId: null });
      await atualizarPlanoUsuario(pagamento.userId);
    }

    res.json({
      success: true,
      message: 'Cobrança excluída com sucesso.',
      exclusao: {
        excluidoPor: adminNome,
        dataExclusao: agora,
        motivo: motivo.trim(),
      },
    });
  } catch (error) {
    console.error('[Admin] Erro ao cancelar:', error);
    res.status(500).json({ message: error.message || 'Erro ao cancelar cobrança.' });
  }
});

    if (pagamento.status !== 'pendente') {
      return res.status(400).json({
        message: `Nao e possivel excluir cobrancas com status "${pagamento.status}". Apenas cobrancas PENDENTES podem ser excluidas.`,
      });
    }

    const { motivo } = req.body || {};
    if (!motivo || motivo.trim().length < 5) {
      return res.status(400).json({ message: 'Informe um motivo com pelo menos 5 caracteres para a exclusao.' });
    }

    console.log(`[Admin] Excluindo cobranca ${pagamento._id} (${pagamento.asaasId}) por motivo: ${motivo.trim()}`);
    await cancelarCobrancaAsaas(pagamento);

    const adminNome = req.user?.name || req.user?.email || 'Admin';
    const agora = new Date();

    pagamento.status = 'cancelado';
    pagamento.cobrancaAtiva = false;
    pagamento.excluidoPor = req.userId;
    pagamento.excluidoPorNome = adminNome;
    pagamento.dataExclusao = agora;
    pagamento.motivoExclusao = motivo.trim();
    pagamento.historico.push({
      status: 'cancelado',
      descricao: `Cobranca excluida por ${adminNome}. Motivo: ${motivo.trim()}`,
    });
    await pagamento.save();

    if (pagamento.bikeId) {
      await Bike.findByIdAndUpdate(pagamento.bikeId, { pagamentoAtualId: null });
    }
    if (pagamento.bikeId) await atualizarPlanoUsuario(pagamento.userId);

    res.json({
      success: true,
      message: 'Cobranca excluida com sucesso.',
      exclusao: {
        excluidoPor: adminNome,
        dataExclusao: agora,
        motivo: motivo.trim(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erro ao cancelar cobranca.' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const webhookToken = req.query.token || req.headers['asaas-access-token'];
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (!expectedToken) return res.status(503).json({ message: 'Webhook nao configurado.' });
    if (webhookToken !== expectedToken) return res.status(401).json({ message: 'Token invalido.' });

    const { event, payment } = req.body;
    if (!payment?.id) return res.status(200).json({ received: true });

    const filtros = [{ asaasId: payment.id }];
    if (payment.subscription) filtros.push({ asaasSubscriptionId: payment.subscription });
    const pagamento = await Pagamento.findOne({ $or: filtros });
    if (!pagamento) return res.status(200).json({ received: true });

    const evento = String(event || payment.status || '').replace(/^PAYMENT_/, '');
    const statusMap = {
      CONFIRMED: 'pago',
      RECEIVED: 'pago',
      RECEIVED_IN_CASH: 'pago',
      OVERDUE: 'atrasado',
      DELETED: 'cancelado',
      REFUNDED: 'cancelado',
      CHARGEBACK_REQUESTED: 'cancelado',
    };
    const novoStatus = statusMap[evento] || pagamento.status;
    pagamento.status = novoStatus;

    if (novoStatus === 'pago') {
      const recebimentoExiste = pagamento.recebimentos.some(item => item.asaasId === payment.id);
      if (!recebimentoExiste) {
        const vencimento = payment.dueDate ? new Date(`${payment.dueDate}T12:00:00Z`) : new Date();
        pagamento.recebimentos.push({
          asaasId: payment.id,
          status: novoStatus,
          valor: Math.round(Number(payment.value || 0) * 100),
          dataVencimento: vencimento,
          dataPagamento: new Date(),
        });
        pagamento.dataPagamento = new Date();

        const expiracaoCalculada = pagamento.frequencia === 'anual'
          ? adicionarAnos(new Date(), 1)
          : adicionarMeses(new Date(Math.max(Number(vencimento), Date.now())), 1);
        if (pagamento.bikeId) {
          const bikeAtual = await Bike.findById(pagamento.bikeId).select('planoDataExpiracao');
          const expiracao = bikeAtual?.planoDataExpiracao > expiracaoCalculada
            ? bikeAtual.planoDataExpiracao
            : expiracaoCalculada;
          await Bike.findByIdAndUpdate(pagamento.bikeId, {
            plano: pagamento.plano,
            planoAtivo: true,
            planoDataAtivacao: new Date(),
            planoDataExpiracao: expiracao,
            pagamentoAtualId: pagamento._id,
          });
        } else {
          // Compatibilidade com cobrancas antigas, criadas antes do vinculo
          // obrigatorio por equipamento.
          await User.findByIdAndUpdate(pagamento.userId, {
            plano: pagamento.plano,
            planoAtivo: true,
            planoDataAtivacao: new Date(),
            planoDataExpiracao: expiracaoCalculada,
          });
        }

        if (
          pagamento.frequencia === 'mensal'
          && pagamento.recebimentos.length >= pagamento.quantidadeCobrancas
        ) {
          try {
            console.log(`[Admin] Excluindo cobranca ${pagamento._id} (${pagamento.asaasId}) por motivo: ${motivo.trim()}`);
    await cancelarCobrancaAsaas(pagamento);
          } catch (cancelError) {
            console.error('[Webhook] Nao foi possivel encerrar assinatura anual:', cancelError.message);
          }
          pagamento.cobrancaAtiva = false;
        }
      }
    } else if (novoStatus === 'cancelado') {
      if (pagamento.frequencia === 'mensal' && pagamento.asaasSubscriptionId) {
        // O cancelamento isolado de uma parcela nao significa que a
        // assinatura recorrente inteira foi encerrada.
        pagamento.status = 'atrasado';
      } else {
        pagamento.cobrancaAtiva = false;
      }
    }

    pagamento.historico.push({
      status: novoStatus,
      descricao: `Webhook Asaas: ${event || payment.status}`,
    });
    await pagamento.save();
    if (pagamento.bikeId) await atualizarPlanoUsuario(pagamento.userId);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook] Erro:', error);
    res.status(200).json({ received: true });
  }
});

router.post('/criar-minha-cobranca', userAuth, async (req, res) => {
  try {
    const {
      plano,
      bikeId,
      metodoPagamento,
      frequencia = 'mensal',
    } = req.body;
    if (!bikeId) return res.status(400).json({ message: 'Escolha o equipamento que recebera a protecao.' });

    const [user, bike] = await Promise.all([
      User.findById(req.userId),
      Bike.findOne({ _id: bikeId, userId: req.userId }),
    ]);
    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado.' });
    if (!bike) return res.status(404).json({ message: 'Equipamento nao encontrado na sua conta.' });

    const resultado = await criarCobranca({
      user,
      bike,
      plano,
      metodoPagamento,
      frequencia,
    });
    res.json({
      success: true,
      reused: resultado.reutilizada,
      pagamento: respostaPagamento(resultado.pagamento, resultado.cobranca),
      mensagem: resultado.reutilizada
        ? 'Este equipamento ja possui uma cobranca ativa. Exibimos a cobranca existente.'
        : 'Cobranca criada e vinculada ao equipamento.',
    });
  } catch (error) {
    console.error('[Pagamento] Erro:', error);
    res.status(400).json({ message: error.message || 'Erro ao criar cobranca.' });
  }
});

router.get('/meu-plano', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario nao encontrado.' });
    const pagamentos = await Pagamento.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json({
      plano: user.plano,
      planoAtivo: user.planoAtivo,
      planoDataAtivacao: user.planoDataAtivacao,
      planoDataExpiracao: user.planoDataExpiracao,
      pagamentos,
      ultimoPagamento: pagamentos[0] || null,
    });
  } catch {
    res.status(500).json({ message: 'Erro ao verificar plano.' });
  }
});

module.exports = router;
