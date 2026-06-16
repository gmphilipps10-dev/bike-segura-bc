// Serviço de integração com a Evolution API (WhatsApp)
const Ocorrencia = require('../models/Ocorrencia');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://evolution:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'bike-segura-bc-2024';

// ===== EXTRACAO INTELIGENTE DE DADOS DO TEXTO (reutilizado do ocorrencias.js) =====
const BAIRROS_BC = [
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

const MARCAS_BIKE = [
  ['caloi', 'Caloi'], ['trek', 'Trek'], ['specialized', 'Specialized'],
  ['giant', 'Giant'], ['oggi', 'Oggi'], ['sense', 'Sense'],
  ['cannondale', 'Cannondale'], ['scott', 'Scott'], ['sundown', 'Sundown'],
  ['ell', 'ELL'], ['ktm', 'KTM'], ['orbea', 'Orbea'], ['focus', 'Focus'],
  ['bmc', 'BMC'], ['soul', 'Soul'], ['tsw', 'TSW'], ['first', 'First'],
  ['audax', 'Audax'], ['spd', 'SPD'], ['gios', 'Gios'], ['monark', 'Monark'],
  ['mormaii', 'Mormaii'], ['totem', 'Totem'], ['viking', 'Viking'],
  ['tito', 'Tito'], ['woul', 'Woul'], ['status', 'Status'],
  ['groove', 'Groove'], ['oxford', 'Oxford'], ['raphael', 'Raphael'],
  ['fuji', 'Fuji'], ['lapierre', 'Lapierre'], ['cervelo', 'Cervelo'],
  ['bianchi', 'Bianchi'], ['pinarello', 'Pinarello'], ['colnago', 'Colnago'],
  ['look', 'Look'], [' bh ', 'BH'],
];

const CORES = [
  ['branca?', 'Branca'], ['preta?', 'Preta'], ['azul', 'Azul'],
  ['vermelha?', 'Vermelha'], ['verde', 'Verde'], ['amarela?', 'Amarela'],
  ['laranja', 'Laranja'], ['cinza', 'Cinza'], ['prata', 'Prata'],
  ['dourada?', 'Dourada'], ['roxa?', 'Roxa'], ['rosa', 'Rosa'],
  ['bege', 'Bege'], ['marrom', 'Marrom'], ['champagne', 'Champagne'],
  ['bronze', 'Bronze'], ['grafite', 'Grafite'], ['turquesa', 'Turquesa'],
  ['vinho', 'Vinho'], ['preta? fosca', 'Preta Fosca'],
];

function extrairDadosDoTexto(texto) {
  const resultado = {
    endereco: '', bairro: '', dataOcorrencia: new Date(),
    titulo: '', descricao: texto.trim(), veiculoTipo: '', veiculoCor: '', veiculoMarca: ''
  };
  const textoLower = texto.toLowerCase();

  // 1. Tipo veiculo
  if (/\b(bicicleta|bike|pedal|ciclismo|ciclista)\b/i.test(texto)) resultado.veiculoTipo = 'Bicicleta';
  else if (/\b(patinete)\b/i.test(texto)) resultado.veiculoTipo = 'Patinete';
  else if (/\b(skate)\b/i.test(texto)) resultado.veiculoTipo = 'Skate';
  else if (/\b(motocicleta|moto)\b/i.test(texto)) resultado.veiculoTipo = 'Motocicleta';
  else resultado.veiculoTipo = 'Bicicleta';

  // 2. Cor
  for (const [pattern, corNome] of CORES) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    if (regex.test(textoLower)) { resultado.veiculoCor = corNome; break; }
  }

  // 3. Marca
  for (const [pattern, marcaNome] of MARCAS_BIKE) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    if (regex.test(texto)) { resultado.veiculoMarca = marcaNome; break; }
  }

  // 4. Bairro
  let bairroEncontrado = '', bairroMatchLen = 0;
  for (const [pattern, nomeOficial] of BAIRROS_BC) {
    const regex = new RegExp(`\\b${pattern.replace(/ /g, '\\s+')}\\b`, 'i');
    if (regex.test(textoLower)) {
      if (pattern.length > bairroMatchLen) { bairroEncontrado = nomeOficial; bairroMatchLen = pattern.length; }
    }
  }
  resultado.bairro = bairroEncontrado;

  // 5. Data
  const hoje = new Date();
  if (/\banteontem\b/i.test(texto)) resultado.dataOcorrencia = new Date(hoje.getTime() - 172800000);
  else if (/\bontem\b/i.test(texto)) resultado.dataOcorrencia = new Date(hoje.getTime() - 86400000);
  else if (/\bhoje\b/i.test(texto)) resultado.dataOcorrencia = hoje;
  else {
    const dataPatterns = [/(\d{1,2})[\/](\d{1,2})[\/](\d{4})/, /(\d{1,2})[\/](\d{1,2})[\/](\d{2})/, /(\d{1,2})[\/](\d{1,2})/];
    for (const dp of dataPatterns) {
      const dataMatch = texto.match(dp);
      if (dataMatch) {
        const dia = parseInt(dataMatch[1]), mes = parseInt(dataMatch[2]) - 1;
        let ano = hoje.getFullYear();
        if (dataMatch[3]) ano = dataMatch[3].length === 2 ? 2000 + parseInt(dataMatch[3]) : parseInt(dataMatch[3]);
        if (mes >= 0 && mes <= 11 && dia >= 1 && dia <= 31) { resultado.dataOcorrencia = new Date(ano, mes, dia); break; }
      }
    }
  }

  // 6. Horario
  const horaPatterns = [/(\d{1,2}):\s*(\d{2})\s*(?:h|hs|horas)?/i, /(\d{1,2})h(\d{2})/i, /(\d{1,2})\s*(?:h|hs|horas)/i, /às?\s*(\d{1,2}):?(\d{2})?/i, /as\s*(\d{1,2}):?(\d{2})?/i, /por volta(?: das?)?\s*(\d{1,2}):?(\d{2})?/i];
  for (const hp of horaPatterns) {
    const horaMatch = texto.match(hp);
    if (horaMatch) {
      const hora = parseInt(horaMatch[1]), min = horaMatch[2] ? parseInt(horaMatch[2]) : 0;
      if (hora >= 0 && hora <= 23) { resultado.dataOcorrencia.setHours(hora, min, 0, 0); break; }
    }
  }

  // 7. Endereco
  let enderecoExtraido = '';
  const enderecoPatterns = [
    /(?:na|em|no|a)\s+(rua|av\.?|avenida|al\.?|alameda|travessa|trav\.?|praça|rodovia|estrada|bairro|loteamento|parque)\s+([^,.;\n]{3,80})/i,
    /(?:próximo|perto|em frente|ao lado|atrás|entre)\s+(?:ao?|da?|de)?\s+([^,.;\n]{3,80})/i,
    /(?:furto|roubo|levaram|perdi|subtrairam?|marcharão?)\s+(?:de|da|na|no|em)\s+(?:[a-z]+\s+)?([^,.;]{5,80})/i,
    /(?:local|endereço|localização|onde|no endereço)\s*[:\-]?\s*([^,.;\n]{3,80})/i,
  ];
  for (const pattern of enderecoPatterns) {
    const match = texto.match(pattern);
    if (match) {
      let candidato = match[1].trim();
      if (match[2]) candidato = match[2].trim();
      candidato = candidato.replace(/\s+/g, ' ').trim();
      if (candidato.length >= 3 && !/^(eu|ele|ela|nós|ela|um|uma|o|a)$/i.test(candidato)) { enderecoExtraido = candidato; break; }
    }
  }
  if (!enderecoExtraido) {
    const viasConhecidas = ['av\. brasil', 'avenida brasil', 'av brasil', 'av\. atlântica', 'avenida atlântica', 'av atlântica', 'av\. atlantica', 'av\. do estado', 'avenida do estado', 'av do estado', 'av\. central', 'avenida central', 'av central', 'av\. das flores', 'avenida das flores', 'av\. martin luther', 'avenida martin luther', 'av\. beira rio', 'avenida beira rio', 'av\. nereu ramos', 'avenida nereu ramos', 'rua bento cunha', 'rua 3700', '3ª avenida', '4ª avenida', '5ª avenida', 'rua aqueduto', 'interpraias', 'rodesindo pavan'];
    for (const via of viasConhecidas) {
      const regex = new RegExp(`(?:na|em|no\\s+)?${via}([^,.;]{0,30})`, 'i');
      const match = textoLower.match(regex);
      if (match) { enderecoExtraido = match[0].replace(/^(na|em|no)\s+/i, '').trim(); break; }
    }
  }
  if (!enderecoExtraido && resultado.bairro) enderecoExtraido = resultado.bairro + ', Balneario Camboriu, SC';
  resultado.endereco = enderecoExtraido;

  // 8. Titulo
  const partes = ['Furto de'];
  if (resultado.veiculoMarca) partes.push(resultado.veiculoMarca);
  partes.push(resultado.veiculoTipo || 'veiculo');
  if (resultado.veiculoCor) partes.push(resultado.veiculoCor);
  resultado.titulo = partes.join(' ') + ' - ' + (resultado.bairro || 'Balneario Camboriu');

  return resultado;
}

// ===== GEOCODING =====
async function geocodeEndereco(endereco) {
  try {
    let query = endereco;
    if (!query.toLowerCase().includes('balneario') && !query.toLowerCase().includes('camboriu')) {
      query += ', Balneario Camboriu, SC, Brasil';
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'BikeSeguraBC/1.0' } });
    const data = await response.json();
    if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), enderecoFormatado: data[0].display_name };
    return null;
  } catch (err) { console.error('[Geocoding] Erro:', err.message); return null; }
}

// ===== PROCESSAR MENSAGEM RECEBIDA DO WEBHOOK =====
async function processarMensagem(data) {
  try {
    console.log('[Evolution] Mensagem recebida:', JSON.stringify(data, null, 2));

    // Ignora mensagens enviadas pelo próprio bot
    if (data.key?.fromMe) { console.log('[Evolution] Ignorando mensagem do próprio bot'); return { ok: true, ignorada: true }; }

    // Pega o texto da mensagem
    const texto = data.message?.conversation || data.message?.extendedTextMessage?.text || '';
    if (!texto || texto.trim().length < 5) { console.log('[Evolution] Texto muito curto'); return { ok: true, ignorada: true }; }

    // Verifica se é uma mensagem de furto (palavras-chave)
    const palavrasChave = ['furto', 'roubo', 'roubaram', 'furtaram', 'levaram', 'perdi', 'perdida', 'subtra', 'marcharam', 'bike', 'bicicleta'];
    const ehFurto = palavrasChave.some(p => texto.toLowerCase().includes(p));
    if (!ehFurto) { console.log('[Evolution] Não é mensagem de furto'); return { ok: true, ignorada: true, motivo: 'Não contém palavras-chave de furto' }; }

    console.log('[Evolution] Processando mensagem de furto:', texto.substring(0, 100));

    // Extrai dados do texto
    const dados = extrairDadosDoTexto(texto.trim());
    console.log('[Evolution] Dados extraídos:', dados);

    // Se não achou endereco, usa bairro
    if (!dados.endereco && dados.bairro) dados.endereco = dados.bairro + ', Balneario Camboriu, SC';
    if (!dados.endereco) { console.log('[Evolution] Endereço não identificado'); return { ok: false, erro: 'Endereço não identificado' }; }

    // Geocoding
    let geo = await geocodeEndereco(dados.endereco);
    // Fallback: tenta com bairro
    if (!geo && dados.bairro) geo = await geocodeEndereco(dados.bairro + ', Balneario Camboriu, SC');
    if (!geo) { console.log('[Evolution] Geocoding falhou'); return { ok: false, erro: 'Não foi possível localizar no mapa', enderecoTentado: dados.endereco }; }

    // Cria a ocorrência
    const ocorrencia = new Ocorrencia({
      tipo: 'monitorado',
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
      fonte: 'WhatsApp Grupo',
      status: 'ativo'
    });

    await ocorrencia.save();
    console.log('[Evolution] Ocorrência salva:', ocorrencia._id);

    return { ok: true, ocorrencia, dadosExtraidos: dados, geocoding: geo };
  } catch (err) {
    console.error('[Evolution] Erro ao processar:', err);
    return { ok: false, erro: err.message };
  }
}

// ===== FUNÇÕES DA API EVOLUTION =====
async function fetchEvolution(path, options = {}) {
  const url = `${EVOLUTION_API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': EVOLUTION_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res;
}

// Criar instância (conectar número)
async function criarInstancia(nome) {
  const res = await fetchEvolution('/instance/create', {
    method: 'POST',
    body: JSON.stringify({ instanceName: nome, qrcode: true }),
  });
  return res.json();
}

// Listar instâncias
async function listarInstancias() {
  const res = await fetchEvolution('/instance/fetchInstances', { method: 'POST' });
  return res.json();
}

// Conectar instância
async function conectarInstancia(nome) {
  const res = await fetchEvolution('/instance/connect/' + nome, { method: 'GET' });
  return res.json();
}

// Desconectar
async function desconectarInstancia(nome) {
  const res = await fetchEvolution('/instance/logout/' + nome, { method: 'DELETE' });
  return res.json();
}

// Deletar
async function deletarInstancia(nome) {
  const res = await fetchEvolution('/instance/delete/' + nome, { method: 'DELETE' });
  return res.json();
}

module.exports = {
  processarMensagem,
  criarInstancia,
  listarInstancias,
  conectarInstancia,
  desconectarInstancia,
  deletarInstancia,
  extrairDadosDoTexto,
  geocodeEndereco,
};
