const PlanoConfig = require('../models/PlanoConfig');

const PLANOS_PADRAO_CENTAVOS = Object.freeze({
  bronze: 417,
  prata: 1250,
  ouro: 2500,
  diamante: 3750,
});

const PLANOS_IDS = Object.keys(PLANOS_PADRAO_CENTAVOS);

async function getPrecosCentavos() {
  let config = await PlanoConfig.findOne({ chave: 'principal' }).lean();

  // Os valores salvos antes desta versao eram anuais. A migracao divide por
  // doze uma unica vez para preservar o mesmo total anual e passar a exibir
  // mensalidades menores no aplicativo.
  if (config?.precosCentavos && config.modeloCobranca !== 'mensal-v1') {
    const precosMensais = Object.fromEntries(
      PLANOS_IDS.map(plano => [
        plano,
        Math.max(1, Math.round(Number(config.precosCentavos[plano] || 0) / 12)),
      ])
    );

    config = await PlanoConfig.findOneAndUpdate(
      { chave: 'principal', modeloCobranca: { $ne: 'mensal-v1' } },
      { $set: { precosCentavos: precosMensais, modeloCobranca: 'mensal-v1' } },
      { new: true }
    ).lean() || { ...config, precosCentavos: precosMensais, modeloCobranca: 'mensal-v1' };
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
    { $set: { precosCentavos, modeloCobranca: 'mensal-v1' } },
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
