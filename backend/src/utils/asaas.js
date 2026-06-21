const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_ENV = process.env.ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

function getAsaasApiKey() {
  return ASAAS_API_KEY;
}

function extrairMensagemErro(data, status) {
  const mensagens = Array.isArray(data?.errors)
    ? data.errors.map(error => error.description || error.code).filter(Boolean)
    : [];
  return mensagens.join(' ') || data?.message || `Erro ${status} retornado pelo Asaas.`;
}

async function asaasRequest(endpoint, method = 'GET', body = null) {
  if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY nao configurada.');

  const response = await fetch(`${ASAAS_ENV}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.errors?.length) {
    throw new Error(extrairMensagemErro(data, response.status));
  }

  return data;
}

async function cancelarCobrancaAsaas(pagamento) {
  if (!ASAAS_API_KEY || !pagamento) return;

  if (pagamento.asaasInstallmentId && pagamento.status !== 'pago') {
    await asaasRequest(`/installments/${pagamento.asaasInstallmentId}`, 'DELETE');
    return;
  }

  if (pagamento.asaasSubscriptionId) {
    await asaasRequest(`/subscriptions/${pagamento.asaasSubscriptionId}`, 'DELETE');
    return;
  }

  // Uma cobranca anual ja recebida nao possui parcelas futuras para cancelar.
  if (pagamento.asaasId && pagamento.status !== 'pago') {
    await asaasRequest(`/payments/${pagamento.asaasId}`, 'DELETE');
  }
}

module.exports = {
  asaasRequest,
  cancelarCobrancaAsaas,
  getAsaasApiKey,
};
