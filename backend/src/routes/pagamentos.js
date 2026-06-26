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
const { exigirCpfValido, normalizarCpf } = require('../utils/cpf');
const {
  calcularParcelamentoCartao,
  normalizarParcelasCartao,
  opcoesParcelamentoCartao,
} = require('../utils/cartao');
const {
  normalizarCodigoParceiro,
  buscarLojaAtivaPorCodigo,
  registrarVendaParceira,
  cancelarVendasParceirasDoPagamento,
} = require('../utils/partnerSales');

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

function mensalidadeDoValorAnual(valorAnualCentavos) {
  return Math.max(1, Math.round(Number(valorAnualCentavos || 0) / 12));
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
    valorBase: pagamento.valorBase || pagamento.valor,
    valorEncargos: pagamento.valorEncargos || 0,
    valorMensal: pagamento.valorMensal,
    valorTotal: pagamento.valorTotal,
    parcelasCartao: pagamento.parcelasCartao || 1,
    status: pagamento.status,
    cobrancaAtiva: pagamento.cobrancaAtiva,
    metodoPagamento: pagamento.metodoPagamento,
    codigoParceiro: pagamento.codigoParceiro || '',
    partnerStoreName: pagamento.partnerStoreName || '',
    linkPagamento: cobranca?.invoiceUrl || pagamento.linkPagamento || '',
    pixQrCode: pagamento.pixQrCode || '',
    pixPayload: pagamento.pixPayload || '',
    boletoUrl: cobranca?.bankSlipUrl || pagamento.boletoUrl || '',
    dataVencimento: pagamento.dataVencimento,
    createdAt: pagamento.createdAt,
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
  const cpf = exigirCpfValido(user.cpf);
  const clientes = await asaasRequest(`/customers?email=${encodeURIComponent(user.email)}`);
  const cliente = clientes.data?.[0];
  const dadosAtualizados = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    cpfCnpj: cpf,
  };

  if (cliente?.id) {
    const precisaAtualizar = (
      cliente.name !== dadosAtualizados.name
      || cliente.email !== dadosAtualizados.email
      || String(cliente.phone || '').replace(/\D/g, '') !== String(dadosAtualizados.phone || '').replace(/\D/g, '')
      || normalizarCpf(cliente.cpfCnpj) !== cpf
    );

    if (precisaAtualizar) {
      await asaasRequest(`/customers/${cliente.id}`, 'PUT', dadosAtualizados);
    }
    return cliente.id;
  }

  const novoCliente = await asaasRequest('/customers', 'POST', dadosAtualizados);
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

async function criarCobranca({
  user,
  bike,
  plano,
  metodoPagamento,
  frequencia,
  dataVencimento,
  parcelasCartao = 1,
  codigoParceiro = '',
}) {
  if (!getAsaasApiKey()) throw new Error('ASAAS_API_KEY nao configurada.');
  if (!FREQUENCIAS.includes(frequencia)) throw new Error('Escolha pagamento mensal ou anual.');
  if (!METODOS.includes(metodoPagamento)) throw new Error('Forma de pagamento invalida.');

  const valorTotal = await getPlanoValorCentavos(plano);
  if (!valorTotal) throw new Error('Plano invalido.');
  const valorMensal = mensalidadeDoValorAnual(valorTotal);
  const parcelas = metodoPagamento === 'cartao' && frequencia === 'anual'
    ? normalizarParcelasCartao(parcelasCartao)
    : 1;
  const codigoParceiroNormalizado = normalizarCodigoParceiro(codigoParceiro);
  const lojaParceira = codigoParceiroNormalizado
    ? await buscarLojaAtivaPorCodigo(codigoParceiroNormalizado)
    : null;
  if (codigoParceiroNormalizado && !lojaParceira) {
    throw new Error('Loja parceira invalida ou inativa.');
  }

  const existente = await obterCobrancaAtiva(bike);
  if (existente) {
    const mesmoContrato = (
      existente.plano === plano
      && existente.frequencia === frequencia
      && String(existente.metodoPagamento || '').toLowerCase() === metodoPagamento
      && Number(existente.parcelasCartao || 1) === parcelas
    );

    if (existente.status === 'pago' || mesmoContrato) {
      if (lojaParceira && existente.status !== 'pago') {
        existente.partnerStoreId = lojaParceira._id;
        existente.codigoParceiro = lojaParceira.codigo_parceiro;
        existente.partnerStoreName = lojaParceira.nome_fantasia;
        existente.partnerCommissionPercentage = Number(lojaParceira.percentual_comissao || 10);
        existente.historico.push({
          status: existente.status,
          descricao: `Origem da venda atualizada para loja parceira ${lojaParceira.nome_fantasia}`,
        });
        await existente.save();
      }
      return {
        pagamento: existente,
        reutilizada: true,
        substituida: false,
      };
    }
  }

  const parcelamentoCartao = metodoPagamento === 'cartao' && frequencia === 'anual'
    ? calcularParcelamentoCartao(valorTotal, parcelas)
    : null;
  const valorBase = frequencia === 'mensal' ? valorMensal : valorTotal;
  const valorEncargos = parcelamentoCartao?.valorEncargos || 0;
  const valorCobrado = parcelamentoCartao?.valorCobrado || valorBase;
  const vencimento = dataVencimento ? new Date(dataVencimento) : new Date();
  if (!dataVencimento) vencimento.setDate(vencimento.getDate() + 3);
  const externalReference = `bike-${bike._id}-${Date.now()}`;
  const customerId = await buscarOuCriarClienteAsaas(user);
  let substituida = false;

  if (existente) {
    await cancelarCobrancaAsaas(existente);
    existente.status = 'cancelado';
    existente.cobrancaAtiva = false;
    existente.historico.push({
      status: 'cancelado',
      descricao: `Cobranca substituida por ${metodoPagamento.toUpperCase()}`,
    });
    await existente.save();
    bike.pagamentoAtualId = null;
    await bike.save();
    substituida = true;
  }

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
      valorBase,
      valorEncargos,
      valorMensal,
      valorTotal,
      parcelasCartao: parcelas,
      frequencia,
      quantidadeCobrancas: frequencia === 'mensal' ? 12 : parcelas,
      cobrancaAtiva: true,
      status: 'pendente',
      metodoPagamento,
      partnerStoreId: lojaParceira?._id || null,
      codigoParceiro: lojaParceira?.codigo_parceiro || '',
      partnerStoreName: lojaParceira?.nome_fantasia || '',
      partnerCommissionPercentage: Number(lojaParceira?.percentual_comissao || 10),
      dataVencimento: vencimento,
      externalReference,
      historico: [{
        status: 'pendente',
        descricao: `Contratacao ${frequencia} reservada para o equipamento ${bike.name}${lojaParceira ? ` via loja parceira ${lojaParceira.nome_fantasia}` : ''}`,
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
      const dadosCobranca = {
        customer: customerId,
        billingType: billingType(metodoPagamento),
        dueDate: dataAsaas(vencimento),
        description: `Bike Segura BC - ${plano.toUpperCase()} anual - ${bike.name}`,
        externalReference,
      };

      if (metodoPagamento === 'cartao' && parcelas > 1) {
        dadosCobranca.installmentCount = parcelas;
        dadosCobranca.totalValue = valorCobrado / 100;
      } else {
        dadosCobranca.value = valorCobrado / 100;
      }

      cobranca = await asaasRequest('/payments', 'POST', dadosCobranca);
      pagamento.asaasInstallmentId = cobranca.installment || '';
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

    return { pagamento, cobranca, reutilizada: false, substituida };
  } catch (error) {
    try {
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
    const precosAnuaisCentavos = await getPrecosCentavos();
    const precosMensaisCentavos = Object.fromEntries(
      Object.entries(precosAnuaisCentavos).map(([plano, valor]) => [plano, mensalidadeDoValorAnual(valor)])
    );
    res.json({
      precos: centavosParaReais(precosAnuaisCentavos),
      precosAnuais: centavosParaReais(precosAnuaisCentavos),
      precosMensais: centavosParaReais(precosMensaisCentavos),
      periodicidade: 'anual',
    });
  } catch {
    res.status(500).json({ message: 'Erro ao carregar os precos dos planos.' });
  }
});

router.get('/simulacao-cartao', async (req, res) => {
  try {
    const valorAnual = await getPlanoValorCentavos(req.query.plano);
    if (!valorAnual) return res.status(400).json({ message: 'Plano invalido.' });

    res.json({
      valorBase: valorAnual,
      opcoes: opcoesParcelamentoCartao(valorAnual, 12),
      observacao: 'Os encargos exibidos correspondem ao processamento do cartao. Antecipacao de recebiveis nao esta incluida.',
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Erro ao simular o parcelamento.' });
  }
});

router.put('/planos', adminMiddleware, async (req, res) => {
  try {
    const precos = await salvarPrecos(req.body?.precos);
    const precosMensaisCentavos = Object.fromEntries(
      Object.entries(await getPrecosCentavos()).map(([plano, valor]) => [plano, mensalidadeDoValorAnual(valor)])
    );
    res.json({
      success: true,
      precos,
      precosAnuais: precos,
      precosMensais: centavosParaReais(precosMensaisCentavos),
      periodicidade: 'anual',
    });
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
      parcelasCartao = 1,
      codigoParceiro = '',
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
      parcelasCartao,
      codigoParceiro,
    });
    res.json({
      success: true,
      reused: resultado.reutilizada,
      replaced: resultado.substituida,
      pagamento: respostaPagamento(resultado.pagamento, resultado.cobranca),
      mensagem: resultado.reutilizada
        ? 'Este equipamento ja possui uma cobranca ativa.'
        : resultado.substituida
          ? 'A cobranca anterior foi cancelada e substituida com sucesso.'
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

    const status = String(pagamento.status || '');
    if (status === 'pago') {
      return res.status(400).json({
        message: 'Pagamentos ja pagos nao podem ser excluidos pelo painel.',
      });
    }
    if (status === 'cancelado') {
      return res.status(400).json({
        message: 'Esta cobranca ja esta cancelada.',
      });
    }

    const dataLocal = data => new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(data);
    const hojeLocal = dataLocal(new Date());
    const vencimentoLocal = pagamento.dataVencimento ? dataLocal(new Date(pagamento.dataVencimento)) : '';
    const cobrancaVencida = Boolean(vencimentoLocal && vencimentoLocal < hojeLocal);
    const cobrancaAtrasada = status === 'atrasado';

    if (!cobrancaVencida && !cobrancaAtrasada) {
      return res.status(400).json({
        message: 'Apenas pagamentos vencidos ou atrasados podem ser excluidos. Pagamentos dentro do prazo devem permanecer ativos.',
      });
    }

    const { motivo } = req.body || {};
    if (!motivo || motivo.trim().length < 5) {
      return res.status(400).json({ message: 'Informe um motivo com pelo menos 5 caracteres para a exclusão.' });
    }

    try {
      if (pagamento.asaasId || pagamento.asaasSubscriptionId || pagamento.asaasInstallmentId) {
        await cancelarCobrancaAsaas(pagamento);
      }
    } catch (asaasError) {
      console.error('[Admin] Erro Asaas:', asaasError.message);
      return res.status(502).json({
        message: `Não foi possível cancelar esta cobrança no Asaas: ${asaasError.message}. Tente novamente antes de excluir no painel.`,
      });
    }

    const adminNome = req.user?.name || req.user?.email || (req.isPainelAdmin ? 'Painel Admin' : 'Admin');
    const adminIdValido = /^[0-9a-fA-F]{24}$/.test(String(req.userId || ''));
    const agora = new Date();

    pagamento.status = 'cancelado';
    pagamento.cobrancaAtiva = false;
    pagamento.excluidoPor = adminIdValido ? String(req.userId) : null;
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
    if (payment.installment) filtros.push({ asaasInstallmentId: payment.installment });
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
      CREDIT_CARD_CAPTURE_REFUSED: 'cancelado',
      REFUSED: 'cancelado',
    };
    const novoStatus = statusMap[evento] || pagamento.status;
    pagamento.status = novoStatus;
    let registrarVendaParceiraConfirmada = false;
    let cancelarVendaParceiraConfirmada = false;

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
        registrarVendaParceiraConfirmada = true;

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
        cancelarVendaParceiraConfirmada = ['REFUNDED', 'CHARGEBACK_REQUESTED'].includes(evento);
      } else {
        pagamento.cobrancaAtiva = false;
        cancelarVendaParceiraConfirmada = true;
      }
    }

    pagamento.historico.push({
      status: novoStatus,
      descricao: `Webhook Asaas: ${event || payment.status}`,
    });
    await pagamento.save();

    try {
      if (registrarVendaParceiraConfirmada) {
        await registrarVendaParceira(pagamento, payment);
      }
      if (cancelarVendaParceiraConfirmada) {
        await cancelarVendasParceirasDoPagamento(pagamento, payment);
      }
    } catch (partnerError) {
      console.error('[Webhook] Erro ao sincronizar venda parceira:', partnerError.message);
    }

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
      parcelasCartao = 1,
      codigoParceiro = '',
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
      parcelasCartao,
      codigoParceiro,
    });
    res.json({
      success: true,
      reused: resultado.reutilizada,
      replaced: resultado.substituida,
      pagamento: respostaPagamento(resultado.pagamento, resultado.cobranca),
      mensagem: resultado.reutilizada
        ? 'Este equipamento ja possui uma cobranca ativa. Exibimos a cobranca existente.'
        : resultado.substituida
          ? 'A cobranca anterior foi cancelada e substituida pela nova forma de pagamento.'
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
    const pagamentosVisiveis = pagamentos.map(pagamento => respostaPagamento(pagamento));
    res.json({
      plano: user.plano,
      planoAtivo: user.planoAtivo,
      planoDataAtivacao: user.planoDataAtivacao,
      planoDataExpiracao: user.planoDataExpiracao,
      pagamentos: pagamentosVisiveis,
      ultimoPagamento: pagamentosVisiveis[0] || null,
    });
  } catch {
    res.status(500).json({ message: 'Erro ao verificar plano.' });
  }
});

module.exports = router;
