const PartnerStore = require('../models/PartnerStore');
const PartnerSale = require('../models/PartnerSale');

function normalizarCodigoParceiro(codigo) {
  return String(codigo || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function nomePlano(plano) {
  const value = String(plano || '').toLowerCase();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Plano';
}

function reaisParaCentavos(value) {
  if (value === undefined || value === null || value === '') return 0;
  return Math.round(Number(value || 0) * 100);
}

function calcularComissao({ grossAmount, netAmount, percentage }) {
  const base = Number(netAmount || 0) > 0 ? Number(netAmount) : Number(grossAmount || 0);
  return Math.max(0, Math.round(base * (Number(percentage || 0) / 100)));
}

async function buscarLojaAtivaPorCodigo(codigo) {
  const codigoNormalizado = normalizarCodigoParceiro(codigo);
  if (!codigoNormalizado) return null;
  return PartnerStore.findOne({ codigo_parceiro: codigoNormalizado, status: 'ativa' });
}

async function registrarVendaParceira(pagamento, paymentPayload = {}) {
  if (!pagamento?.partnerStoreId && !pagamento?.codigoParceiro) return null;

  const loja = pagamento.partnerStoreId
    ? await PartnerStore.findById(pagamento.partnerStoreId)
    : await buscarLojaAtivaPorCodigo(pagamento.codigoParceiro);

  if (!loja) return null;

  const codigoParceiro = normalizarCodigoParceiro(pagamento.codigoParceiro || loja.codigo_parceiro);
  const asaasPaymentId = String(paymentPayload.id || paymentPayload.paymentId || pagamento.asaasId || pagamento._id);
  const grossAmount = reaisParaCentavos(paymentPayload.value) || Number(pagamento.valor || 0);
  const netAmount = reaisParaCentavos(paymentPayload.netValue);
  const commissionPercentage = Number(pagamento.partnerCommissionPercentage || loja.percentual_comissao || 10);
  const commissionAmount = calcularComissao({
    grossAmount,
    netAmount,
    percentage: commissionPercentage,
  });

  const existente = await PartnerSale.findOne({
    payment_id: pagamento._id,
    asaas_payment_id: asaasPaymentId,
  });

  if (existente) {
    existente.partner_store_id = loja._id;
    existente.codigo_parceiro = codigoParceiro;
    existente.gross_amount = grossAmount;
    existente.net_amount = netAmount;
    existente.commission_percentage = commissionPercentage;
    existente.commission_amount = commissionAmount;
    existente.payment_status = 'pago';
    existente.sale_status = 'confirmed';
    if (existente.commission_status === 'cancelled') existente.commission_status = 'pending';
    await existente.save();
    return existente;
  }

  return PartnerSale.create({
    partner_store_id: loja._id,
    codigo_parceiro: codigoParceiro,
    user_id: pagamento.userId,
    equipment_id: pagamento.bikeId || null,
    plan_id: pagamento.plano,
    plan_name: nomePlano(pagamento.plano),
    gross_amount: grossAmount,
    net_amount: netAmount,
    commission_percentage: commissionPercentage,
    commission_amount: commissionAmount,
    payment_id: pagamento._id,
    asaas_payment_id: asaasPaymentId,
    payment_status: 'pago',
    sale_status: 'confirmed',
    sold_at: pagamento.dataPagamento || new Date(),
    commission_status: 'pending',
  });
}

async function cancelarVendasParceirasDoPagamento(pagamento, paymentPayload = {}) {
  if (!pagamento?._id) return;
  const filtro = { payment_id: pagamento._id };
  if (paymentPayload?.id) filtro.asaas_payment_id = String(paymentPayload.id);

  await PartnerSale.updateMany(
    filtro,
    { $set: { payment_status: pagamento.status || 'cancelado', sale_status: 'cancelled' } }
  );
  await PartnerSale.updateMany(
    { ...filtro, commission_status: { $ne: 'paid' } },
    { $set: { commission_status: 'cancelled' } }
  );
}

module.exports = {
  normalizarCodigoParceiro,
  buscarLojaAtivaPorCodigo,
  registrarVendaParceira,
  cancelarVendasParceirasDoPagamento,
  calcularComissao,
};
