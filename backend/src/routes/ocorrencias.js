const express = require('express');
const router = express.Router();
const Ocorrencia = require('../models/Ocorrencia');
const auth = require('../middleware/auth');

function podeGerenciarOcorrencias(req) {
  return Boolean(req.isOwner || req.user?.isOwner);
}

function exigirProprietario(req, res) {
  if (podeGerenciarOcorrencias(req)) return true;
  res.status(403).json({
    error: 'Apenas o proprietario do sistema pode cadastrar, editar ou excluir ocorrencias da Area Segura.'
  });
  return false;
}

// ===== GEOCODING via Nominatim (OpenStreetMap) =====
async function geocodeEndereco(endereco) {
  try {
    let query = endereco;
    if (!query.toLowerCase().includes('balneario') && !query.toLowerCase().includes('camboriu')) {
      query += ', Balneario Camboriu, SC, Brasil';
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'BikeSeguraBC/1.0' }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        enderecoFormatado: data[0].display_name
      };
    }
    return null;
  } catch (err) {
    console.error('Erro no geocoding:', err.message);
    return null;
  }
}

// ===== LISTA COMPLETA DE BAIRROS DE BALNEARIO CAMBORIU =====
const BAIRROS_BC = [
  // Principais
  ['centro', 'Centro'],
  ['barra norte', 'Barra Norte'],
  ['barra sul', 'Barra Sul'],
  ['praia brava', 'Praia Brava'],
  ['navegantes', 'Navegantes'],
  ['vilas', 'Vilas'],
  ['vila real', 'Vila Real'],
  ['pioneiros', 'Pioneiros'],
  ['jardim iate clube', 'Jardim Iate Clube'],
  ['rio pequeno', 'Rio Pequeno'],
  ['santa regina', 'Santa Regina'],
  ['nova esperanca', 'Nova Esperanca'],
  ['sao judas tadeu', 'Sao Judas Tadeu'],
  ['sao judas', 'Sao Judas'],
  ['loteamento sol', 'Loteamento Sol'],
  ['parque amendoeiras', 'Parque Amendoeiras'],
  ['principado', 'Principado'],
  ['costa e silva', 'Costa e Silva'],
  ['das nacoes', 'Das Nacoes'],
  ['nacao', 'Das Nacoes'],
  ['estados', 'Estados'],
  ['iguacu', 'Iguacu'],
  ['nova bretanha', 'Nova Bretanha'],
  ['sao joao batista', 'Sao Joao Batista'],
  ['arraial dos ajuda', 'Arraial dos Ajuda'],
  ['loteamento jardim panorama', 'Loteamento Jardim Panorama'],
  ['parque bandeirantes', 'Parque Bandeirantes'],
  ['parque central', 'Parque Central'],
  ['parque eldorado', 'Parque Eldorado'],
  ['parque imperial', 'Parque Imperial'],
  ['parque nova esperanca', 'Parque Nova Esperanca'],
  ['santa ines', 'Santa Ines'],
  ['vila nova', 'Vila Nova'],
  ['vila sao paulo', 'Vila Sao Paulo'],
  ['laranjeiras', 'Laranjeiras'],
  ['taquaras', 'Taquaras'],
  ['taquarinhas', 'Taquarinhas'],
  ['estaleiro', 'Estaleiro'],
  ['estaleirinho', 'Estaleirinho'],
  ['praia do pinho', 'Praia do Pinho'],
  ['barra', 'Barra'],
];

// ===== LISTA DE MARCAS DE BIKES =====
const MARCAS_BIKE = [
  ['caloi', 'Caloi'],
  ['trek', 'Trek'],
  ['specialized', 'Specialized'],
  ['giant', 'Giant'],
  ['oggi', 'Oggi'],
  ['sense', 'Sense'],
  ['cannondale', 'Cannondale'],
  ['scott', 'Scott'],
  ['sundown', 'Sundown'],
  ['ell', 'ELL'],
  ['ktm', 'KTM'],
  ['orbea', 'Orbea'],
  ['focus', 'Focus'],
  ['bmc', 'BMC'],
  ['soul', 'Soul'],
  ['tsw', 'TSW'],
  ['first', 'First'],
  ['audax', 'Audax'],
  ['spd', 'SPD'],
  ['gios', 'Gios'],
  ['monark', 'Monark'],
  ['mormaii', 'Mormaii'],
  ['totem', 'Totem'],
  ['viking', 'Viking'],
  ['tito', 'Tito'],
  ['woul', 'Woul'],
  ['status', 'Status'],
  ['groove', 'Groove'],
  ['oxford', 'Oxford'],
  ['raphael', 'Raphael'],
  ['fuji', 'Fuji'],
  ['lapierre', 'Lapierre'],
  ['cervelo', 'Cervelo'],
  ['bianchi', 'Bianchi'],
  ['pinarello', 'Pinarello'],
  ['colnago', 'Colnago'],
  ['look', 'Look'],
  [' BH ', 'BH'],
];

// ===== CORES =====
const CORES = [
  ['branca?', 'Branca'],
  ['preta?', 'Preta'],
  ['azul', 'Azul'],
  ['vermelha?', 'Vermelha'],
  ['verde', 'Verde'],
  ['amarela?', 'Amarela'],
  ['laranja', 'Laranja'],
  ['cinza', 'Cinza'],
  ['prata', 'Prata'],
  ['dourada?', 'Dourada'],
  ['roxa?', 'Roxa'],
  ['rosa', 'Rosa'],
  ['bege', 'Bege'],
  ['marrom', 'Marrom'],
  ['champagne', 'Champagne'],
  ['bronze', 'Bronze'],
  ['grafite', 'Grafite'],
  ['turquesa', 'Turquesa'],
  ['vinho', 'Vinho'],
  ['preta? fosca', 'Preta Fosca'],
];

// ===== EXTRACAO INTELIGENTE DE DADOS DO TEXTO =====
function extrairDadosDoTexto(texto) {
  console.log('[WhatsApp Parser] Texto recebido:', texto.substring(0, 100));

  const resultado = {
    endereco: '',
    bairro: '',
    dataOcorrencia: new Date(),
    titulo: '',
    descricao: texto.trim(),
    veiculoTipo: '',
    veiculoCor: '',
    veiculoMarca: ''
  };

  const textoLower = texto.toLowerCase();

  // 1. DETECTA TIPO DE VEICULO
  if (/\b(bicicleta|bike|pedal|ciclismo|ciclista)\b/i.test(texto)) {
    resultado.veiculoTipo = 'Bicicleta';
  } else if (/\b(patinete)\b/i.test(texto)) {
    resultado.veiculoTipo = 'Patinete';
  } else if (/\b(skate)\b/i.test(texto)) {
    resultado.veiculoTipo = 'Skate';
  } else if (/\b(motocicleta|moto)\b/i.test(texto)) {
    resultado.veiculoTipo = 'Motocicleta';
  } else {
    resultado.veiculoTipo = 'Bicicleta'; // default
  }

  // 2. DETECTA COR
  for (const [pattern, corNome] of CORES) {
    const regex = new RegExp(`\b${pattern}\b`, 'i');
    if (regex.test(textoLower)) {
      resultado.veiculoCor = corNome;
      break;
    }
  }

  // 3. DETECTA MARCA
  for (const [pattern, marcaNome] of MARCAS_BIKE) {
    const regex = new RegExp(`\b${pattern}\b`, 'i');
    if (regex.test(texto)) {
      resultado.veiculoMarca = marcaNome;
      break;
    }
  }

  // 4. DETECTA BAIRRO (com sinônimos e variações)
  let bairroEncontrado = '';
  let bairroMatchLen = 0;

  for (const [pattern, nomeOficial] of BAIRROS_BC) {
    const regex = new RegExp(`\b${pattern.replace(/ /g, '\s+')}\b`, 'i');
    if (regex.test(textoLower)) {
      // Prefere o match mais longo (evita "barra" ser confundido com "barra norte")
      if (pattern.length > bairroMatchLen) {
        bairroEncontrado = nomeOficial;
        bairroMatchLen = pattern.length;
      }
    }
  }
  resultado.bairro = bairroEncontrado;

  // 5. DETECTA DATA
  const hoje = new Date();
  if (/\banteontem\b/i.test(texto)) {
    resultado.dataOcorrencia = new Date(hoje.getTime() - 172800000);
  } else if (/\bontem\b/i.test(texto)) {
    resultado.dataOcorrencia = new Date(hoje.getTime() - 86400000);
  } else if (/\bhoje\b/i.test(texto)) {
    resultado.dataOcorrencia = hoje;
  } else {
    // Tenta DD/MM/AAAA ou DD/MM
    const dataPatterns = [
      /(\d{1,2})[\/](\d{1,2})[\/](\d{4})/,
      /(\d{1,2})[\/](\d{1,2})[\/](\d{2})/,
      /(\d{1,2})[\/](\d{1,2})/,
    ];
    for (const dp of dataPatterns) {
      const dataMatch = texto.match(dp);
      if (dataMatch) {
        const dia = parseInt(dataMatch[1]);
        const mes = parseInt(dataMatch[2]) - 1;
        let ano = hoje.getFullYear();
        if (dataMatch[3]) {
          ano = dataMatch[3].length === 2 ? 2000 + parseInt(dataMatch[3]) : parseInt(dataMatch[3]);
        }
        if (mes >= 0 && mes <= 11 && dia >= 1 && dia <= 31) {
          resultado.dataOcorrencia = new Date(ano, mes, dia);
          break;
        }
      }
    }
  }

  // 6. DETECTA HORARIO
  const horaPatterns = [
    /(\d{1,2}):\s*(\d{2})\s*(?:h|hs|horas)?/i,
    /(\d{1,2})h(\d{2})/i,
    /(\d{1,2})\s*(?:h|hs|horas)/i,
    /às?\s*(\d{1,2}):?(\d{2})?/i,
    /as\s*(\d{1,2}):?(\d{2})?/i,
    /por volta(?: das?)?\s*(\d{1,2}):?(\d{2})?/i,
  ];
  for (const hp of horaPatterns) {
    const horaMatch = texto.match(hp);
    if (horaMatch) {
      const hora = parseInt(horaMatch[1]);
      const min = horaMatch[2] ? parseInt(horaMatch[2]) : 0;
      if (hora >= 0 && hora <= 23) {
        resultado.dataOcorrencia.setHours(hora, min, 0, 0);
        break;
      }
    }
  }

  // 7. EXTRAI ENDERECO (multiplas estrategias)
  let enderecoExtraido = '';

  // Estrategia 1: Procura por padrões de endereco com preposicao
  const enderecoPatterns = [
    // "na Av. Brasil", "na rua das Flores", "na Rua Bento Cunha"
    /(?:na|em|no|a)\s+(rua|av\.?|avenida|al\.?|alameda|travessa|trav\.?|praça|rodovia|estrada|bairro|loteamento|parque)\s+([^,.;\n]{3,80})/i,
    // "proximo ao/a", "perto do/da", "em frente ao"
    /(?:próximo|perto|em frente|ao lado|atrás|entre)\s+(?:ao?|da?|de)?\s+([^,.;\n]{3,80})/i,
    // "furto na ...", "roubo em ..."
    /(?:furto|roubo|levaram|perdi|subtrairam?|marcharão?)\s+(?:de|da|na|no|em)\s+(?:[a-z]+\s+)?([^,.;]{5,80})/i,
    // "local: ..." ou "endereco: ..."
    /(?:local|endereço|localização|onde|no endereço)\s*[:\-]?\s*([^,.;\n]{3,80})/i,
  ];

  for (const pattern of enderecoPatterns) {
    const match = texto.match(pattern);
    if (match) {
      let candidato = match[1].trim();
      // Se pegou só o tipo (rua, av, etc), pega o grupo 2
      if (match[2]) {
        candidato = match[2].trim();
      }
      // Limpa o candidato
      candidato = candidato.replace(/\s+/g, ' ').trim();
      // Ignora se for muito curto ou genérico
      if (candidato.length >= 3 && !/^(eu|ele|ela|nós|ela|um|uma|o|a)$/i.test(candidato)) {
        enderecoExtraido = candidato;
        break;
      }
    }
  }

  // Estrategia 2: Procura por nomes de ruas/av conhecidas de BC
  if (!enderecoExtraido) {
    const viasConhecidas = [
      'av\. brasil', 'avenida brasil', 'av brasil',
      'av\. atlântica', 'avenida atlântica', 'av atlântica', 'av. atlantica',
      'av\. do estado', 'avenida do estado', 'av do estado',
      'av\. central', 'avenida central', 'av central',
      'av\. das flores', 'avenida das flores',
      'av\. martin luther', 'avenida martin luther',
      'av\. beira rio', 'avenida beira rio',
      'av\. nereu ramos', 'avenida nereu ramos',
      'rua bento cunha', 'rua 3700', 'rua 3700',
      '3ª avenida', '4ª avenida', '5ª avenida',
      'rua aqueduto', 'interpraias', 'rodesindo pavan',
    ];
    for (const via of viasConhecidas) {
      const regex = new RegExp(`(?:na|em|no\s+)?${via}([^,.;]{0,30})`, 'i');
      const match = textoLower.match(regex);
      if (match) {
        enderecoExtraido = match[0].replace(/^(na|em|no)\s+/i, '').trim();
        break;
      }
    }
  }

  // Estrategia 3: Usa o bairro como endereco fallback
  if (!enderecoExtraido && resultado.bairro) {
    enderecoExtraido = resultado.bairro + ', Balneario Camboriu, SC';
  }

  resultado.endereco = enderecoExtraido;

  // 8. GERA TITULO
  const partes = [];
  partes.push('Furto de');
  if (resultado.veiculoMarca) partes.push(resultado.veiculoMarca);
  partes.push(resultado.veiculoTipo || 'veiculo');
  if (resultado.veiculoCor) partes.push(resultado.veiculoCor);

  const tipoVeiculoStr = partes.join(' ');
  const bairroStr = resultado.bairro || 'Balneario Camboriu';
  resultado.titulo = `${tipoVeiculoStr} - ${bairroStr}`;

  console.log('[WhatsApp Parser] Resultado:', {
    endereco: resultado.endereco,
    bairro: resultado.bairro,
    cor: resultado.veiculoCor,
    marca: resultado.veiculoMarca,
    tipo: resultado.veiculoTipo,
    data: resultado.dataOcorrencia,
    titulo: resultado.titulo
  });

  return resultado;
}

// ===== LISTAR TODAS (publico) =====
router.get('/', async (req, res) => {
  try {
    const { tipo, status, bairro, dias = 30 } = req.query;
    const filtro = {};

    if (tipo) filtro.tipo = tipo;
    if (status) filtro.status = status;
    else filtro.status = 'ativo';
    if (bairro) filtro.bairro = new RegExp(bairro, 'i');

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - parseInt(dias));
    filtro.dataOcorrencia = { $gte: dataLimite };

    const ocorrencias = await Ocorrencia.find(filtro).sort({ dataOcorrencia: -1 });
    res.json(ocorrencias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ESTATISTICAS (publico) =====
router.get('/stats', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    const stats = await Ocorrencia.aggregate([
      { $match: { status: 'ativo', dataOcorrencia: { $gte: dataLimite } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          manual: { $sum: { $cond: [{ $eq: ['$tipo', 'manual'] }, 1, 0] } },
          monitorado: { $sum: { $cond: [{ $eq: ['$tipo', 'monitorado'] }, 1, 0] } },
          porBairro: { $push: '$bairro' }
        }
      }
    ]);

    const porBairro = {};
    if (stats.length > 0) {
      stats[0].porBairro.forEach(b => {
        if (b) porBairro[b] = (porBairro[b] || 0) + 1;
      });
    }

    res.json({
      total: stats[0]?.total || 0,
      manual: stats[0]?.manual || 0,
      monitorado: stats[0]?.monitorado || 0,
      porBairro,
      periodoDias: dias
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CRIAR VIA TEXTO DO WHATSAPP =====
router.post('/whatsapp', auth, async (req, res) => {
  try {
    if (!exigirProprietario(req, res)) return;

    const { texto } = req.body;
    if (!texto || texto.trim().length < 5) {
      return res.status(400).json({ error: 'Texto muito curto ou vazio' });
    }

    const dados = extrairDadosDoTexto(texto.trim());

    // Se nao achou endereco, usa o bairro como fallback
    if (!dados.endereco && dados.bairro) {
      dados.endereco = dados.bairro + ', Balneario Camboriu, SC';
    }

    if (!dados.endereco) {
      return res.status(400).json({ 
        error: 'Nao foi possivel identificar o endereco no texto. Informe pelo menos o bairro.',
        sugestao: 'Exemplo: "Furto de bike trek azul na Av. Brasil, Centro, ontem as 20h30."'
      });
    }

    const geo = await geocodeEndereco(dados.endereco);
    if (!geo) {
      // Se o geocoding falhar com o endereco especifico, tenta com o bairro
      if (dados.bairro) {
        const geoFallback = await geocodeEndereco(dados.bairro + ', Balneario Camboriu, SC');
        if (geoFallback) {
          const ocorrencia = new Ocorrencia({
            tipo: 'manual',
            endereco: dados.endereco,
            bairro: dados.bairro,
            lat: geoFallback.lat,
            lng: geoFallback.lng,
            titulo: dados.titulo,
            descricao: texto.trim(),
            dataOcorrencia: dados.dataOcorrencia,
            veiculoTipo: dados.veiculoTipo,
            veiculoCor: dados.veiculoCor,
            veiculoMarca: dados.veiculoMarca,
            fonte: 'WhatsApp',
            status: 'ativo'
          });
          await ocorrencia.save();
          return res.json({
            sucesso: true,
            ocorrencia: await Ocorrencia.findById(ocorrencia._id),
            dadosExtraidos: dados,
            geocoding: geoFallback,
            observacao: 'Geocoding usou o bairro como fallback'
          });
        }
      }
      return res.status(400).json({ 
        error: 'Nao foi possivel localizar o endereco no mapa.',
        enderecoTentado: dados.endereco,
        dica: 'Tente informar um bairro ou rua conhecida de Balneario Camboriu.'
      });
    }

    const ocorrencia = new Ocorrencia({
      tipo: 'manual',
      endereco: dados.endereco,
      bairro: dados.bairro,
      lat: geo.lat,
      lng: geo.lng,
      titulo: dados.titulo,
      descricao: texto.trim(),
      dataOcorrencia: dados.dataOcorrencia,
      veiculoTipo: dados.veiculoTipo,
      veiculoCor: dados.veiculoCor,
      veiculoMarca: dados.veiculoMarca,
      fonte: 'WhatsApp',
      status: 'ativo'
    });

    await ocorrencia.save();

    res.json({
      sucesso: true,
      ocorrencia: await Ocorrencia.findById(ocorrencia._id),
      dadosExtraidos: dados,
      geocoding: geo
    });
  } catch (err) {
    console.error('[WhatsApp] Erro:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== CRIAR MANUALMENTE (admin) =====
router.post('/', auth, async (req, res) => {
  try {
    if (!exigirProprietario(req, res)) return;

    const { endereco, lat, lng, titulo, descricao, dataOcorrencia, bairro, veiculoTipo, veiculoCor, veiculoMarca } = req.body;

    if (!endereco || !lat || !lng) {
      return res.status(400).json({ error: 'Endereco, lat e lng sao obrigatorios' });
    }

    const ocorrencia = new Ocorrencia({
      tipo: 'manual',
      endereco,
      bairro: bairro || '',
      lat,
      lng,
      titulo: titulo || '',
      descricao: descricao || '',
      dataOcorrencia: dataOcorrencia ? new Date(dataOcorrencia) : new Date(),
      veiculoTipo: veiculoTipo || '',
      veiculoCor: veiculoCor || '',
      veiculoMarca: veiculoMarca || '',
      fonte: 'Manual',
      status: 'ativo'
    });

    await ocorrencia.save();
    res.json(ocorrencia);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ATUALIZAR (admin) =====
router.put('/:id', auth, async (req, res) => {
  try {
    if (!exigirProprietario(req, res)) return;

    const ocorrencia = await Ocorrencia.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!ocorrencia) return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
    res.json(ocorrencia);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== DELETAR (admin) =====
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!exigirProprietario(req, res)) return;

    const ocorrencia = await Ocorrencia.findByIdAndDelete(req.params.id);
    if (!ocorrencia) return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
    res.json({ sucesso: true, message: 'Ocorrencia removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
