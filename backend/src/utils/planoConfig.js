const PlanoConfig = require('../models/PlanoConfig');

const PLANOS_PADRAO_CENTAVOS = Object.freeze({
  bronze: 5000,
  prata: 15000,
  ouro: 30000,
  diamante: 45000,
});

const PLANOS_IDS = Object.keys(PLANOS_PADRAO_CENTAVOS);
const MODELO_COBRANCA_ATUAL = 'anual-v1';

async function getPrecosCentavos() {
  let config = await PlanoConfig.findOne({ chave: 'principal' }).lean();

  // A fonte oficial dos planos voltou a ser o valor anual. Caso a base ainda
  // esteja na versao mensal-v1, multiplicamos por 12 uma unica vez.
  if (config?.precosCentavos && config.modeloCobranca === 'mensal-v1') {
    const precosAnuais = Object.fromEntries(
      PLANOS_IDS.map(plano => [
        plano,
        Math.max(1, Math.round(Number(config.precosCentavos[plano] || 0) * 12)),
      ])
    );

    config = await PlanoConfig.findOneAndUpdate(
      { chave: 'principal', modeloCobranca: 'mensal-v1' },
      { $set: { precosCentavos: precosAnuais, modeloCobranca: MODELO_COBRANCA_ATUAL } },
      { new: true }
    ).lean() || { ...config, precosCentavos: precosAnuais, modeloCobranca: MODELO_COBRANCA_ATUAL };
  } else if (config?.precosCentavos && config.modeloCobranca !== MODELO_COBRANCA_ATUAL) {
    config = await PlanoConfig.findOneAndUpdate(
      { chave: 'principal' },
      { $set: { modeloCobranca: MODELO_COBRANCA_ATUAL } },
      { new: true }
    ).lean() || { ...config, modeloCobranca: MODELO_COBRANCA_ATUAL };
  }

  return config?.precosCentavos
    ? { ...PLANOS_PADRAO_CENTAVOS, ...config.precosCentavos }
    : { ...PLANOS_PADRAO_CENTAVOS };
}

async function getPlanoValorCentavos(plano) {
  if (!PLANOS_IDS.includes(plano)) return null;
  const precos = await getPrecosCentavos();
  return precos[plano];
}

function centavosParaReais(precosCentavos) {
  return Object.fromEntries(
    PLANOS_IDS.map(plano => [plano, precosCentavos[plano] / 100])
  );
}

function validarPrecosEmReais(precos) {
  if (!precos || typeof precos !== 'object') {
    throw new Error('Informe os precos dos quatro planos.');
  }

  return Object.fromEntries(PLANOS_IDS.map(plano => {
    const valor = Number(precos[plano]);
    if (!Number.isFinite(valor) || valor <= 0 || valor > 100000) {
      throw new Error(`O valor do plano ${plano} deve ser maior que zero.`);
    }
    return [plano, Math.round(valor * 100)];
  }));
}

async function salvarPrecos(precosEmReais) {
  const precosCentavos = validarPrecosEmReais(precosEmReais);
  const config = await PlanoConfig.findOneAndUpdate(
    { chave: 'principal' },
    { $set: { precosCentavos, modeloCobranca: MODELO_COBRANCA_ATUAL } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  return centavosParaReais(config.precosCentavos);
}

module.exports = {
  centavosParaReais,
  getPlanoValorCentavos,
  getPrecosCentavos,
  salvarPrecos,
};
