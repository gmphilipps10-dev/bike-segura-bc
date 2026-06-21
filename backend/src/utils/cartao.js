const TAXA_FIXA_CENTAVOS = Number(process.env.ASAAS_CARD_FIXED_FEE_CENTS || 49);

function percentualCartao(parcelas) {
  if (parcelas <= 1) return Number(process.env.ASAAS_CARD_FEE_1X || 0.0299);
  if (parcelas <= 6) return Number(process.env.ASAAS_CARD_FEE_2_6X || 0.0349);
  if (parcelas <= 12) return Number(process.env.ASAAS_CARD_FEE_7_12X || 0.0399);
  return Number(process.env.ASAAS_CARD_FEE_13_21X || 0.0429);
}

function normalizarParcelasCartao(valor, maximo = 12) {
  const parcelas = Number.parseInt(valor, 10);
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > maximo) {
    throw new Error(`Escolha entre 1 e ${maximo} parcelas no cartao.`);
  }
  return parcelas;
}

function calcularParcelamentoCartao(valorBaseCentavos, quantidadeParcelas) {
  const parcelas = normalizarParcelasCartao(quantidadeParcelas);
  const percentual = percentualCartao(parcelas);
  const totalComEncargos = Math.ceil(
    (Number(valorBaseCentavos) + TAXA_FIXA_CENTAVOS) / (1 - percentual)
  );
  const valorParcela = Math.floor(totalComEncargos / parcelas);
  const valorUltimaParcela = totalComEncargos - (valorParcela * (parcelas - 1));

  return {
    parcelas,
    valorBase: Number(valorBaseCentavos),
    valorEncargos: totalComEncargos - Number(valorBaseCentavos),
    valorCobrado: totalComEncargos,
    valorParcela,
    valorUltimaParcela,
    percentual,
    taxaFixa: TAXA_FIXA_CENTAVOS,
  };
}

function opcoesParcelamentoCartao(valorBaseCentavos, maximo = 12) {
  return Array.from({ length: maximo }, (_item, indice) => (
    calcularParcelamentoCartao(valorBaseCentavos, indice + 1)
  ));
}

module.exports = {
  calcularParcelamentoCartao,
  normalizarParcelasCartao,
  opcoesParcelamentoCartao,
  percentualCartao,
};
