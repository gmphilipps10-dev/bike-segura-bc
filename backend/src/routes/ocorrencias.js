const express = require('express');
const router = express.Router();
const Ocorrencia = require('../models/Ocorrencia');
const auth = require('../middleware/auth');

// ===== GEocoding via Nominatim (OpenStreetMap - gratuito) =====
async function geocodeEndereco(endereco) {
  try {
    // Adiciona "Balneario Camboriu, SC, Brasil" se nao tiver
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

// ===== EXTRACAO INTELIGENTE DE DADOS DO TEXTO =====
function extrairDadosDoTexto(texto) {
  const resultado = {
    endereco: '',
    bairro: '',
    dataOcorrencia: new Date(),
    titulo: '',
    descricao: texto,
    veiculoTipo: '',
    veiculoCor: '',
    veiculoMarca: ''
  };
  
  // Detecta tipo de veiculo
  const tipoMatch = texto.match(/\b(bicicleta|bike|patinete|skate|caminhada|motocicleta|moto|ciclismo)\b/i);
  if (tipoMatch) {
    const tipo = tipoMatch[1].toLowerCase();
    if (tipo === 'bicicleta' || tipo === 'bike' || tipo === 'ciclismo') resultado.veiculoTipo = 'Bicicleta';
    else if (tipo === 'patinete') resultado.veiculoTipo = 'Patinete';
    else if (tipo === 'skate') resultado.veiculoTipo = 'Skate';
    else if (tipo === 'motocicleta' || tipo === 'moto') resultado.veiculoTipo = 'Motocicleta';
  }
  
  // Detecta cor
  const cores = ['branca', 'preta', 'azul', 'vermelha', 'verde', 'amarela', 'laranja', 'cinza', 'prata', 'dourada', 'roxa', 'rosa'];
  for (const cor of cores) {
    if (texto.toLowerCase().includes(cor)) {
      resultado.veiculoCor = cor.charAt(0).toUpperCase() + cor.slice(1);
      break;
    }
  }
  
  // Detecta marca
  const marcas = ['caloi', 'trek', 'specialized', 'giant', 'oggi', 'sense', 'cannondale', 'scott', 't', 'sw', 'sundown', 'ell', 'ktm', 'orbea', 'focus'];
  for (const marca of marcas) {
    const regex = new RegExp(`\\b${marca}\\b`, 'i');
    if (regex.test(texto)) {
      resultado.veiculoMarca = marca.toUpperCase();
      break;
    }
  }
  
  // Detecta bairros de Balneario Camboriu
  const bairros = [
    'centro', 'barra norte', 'barra sul', 'praia brava', 'nacoes', 'vilas', 'vila real',
    'pioneiros', 'jardim iate clube', 'rio pequeno', 'santa regina', 'nova esperanca',
    'loteamento sol', 'parque amendoeiras', 'principado', 'costa e silva', 'sao judas',
    'das nacoes', 'estados', 'iguacu', 'das nações'
  ];
  for (const bairro of bairros) {
    const regex = new RegExp(`\\b${bairro.replace(/s/g, 's?')}\\b`, 'i');
    if (regex.test(texto)) {
      resultado.bairro = bairro.charAt(0).toUpperCase() + bairro.slice(1);
      break;
    }
  }
  
  // Detecta data (hoje, ontem, anteontem, ou data DD/MM)
  const hoje = new Date();
  if (/\bhoje\b/i.test(texto)) {
    resultado.dataOcorrencia = hoje;
  } else if (/\bontem\b/i.test(texto)) {
    resultado.dataOcorrencia = new Date(hoje.getTime() - 86400000);
  } else if (/\banteontem\b/i.test(texto)) {
    resultado.dataOcorrencia = new Date(hoje.getTime() - 172800000);
  } else {
    const dataMatch = texto.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (dataMatch) {
      const dia = parseInt(dataMatch[1]);
      const mes = parseInt(dataMatch[2]) - 1;
      const ano = dataMatch[3] ? (dataMatch[3].length === 2 ? 2000 + parseInt(dataMatch[3]) : parseInt(dataMatch[3])) : hoje.getFullYear();
      resultado.dataOcorrencia = new Date(ano, mes, dia);
    }
  }
  
  // Detecta horario
  const horaMatch = texto.match(/(\d{1,2})[:h](\d{2})\s*(?:h|hs|horas)?/i);
  if (horaMatch) {
    const hora = parseInt(horaMatch[1]);
    const min = parseInt(horaMatch[2]);
    resultado.dataOcorrencia.setHours(hora, min, 0, 0);
  }
  
  // Tenta extrair endereco especifico (depois de "na ", "em ", "rua ", "av. ", "avenida ")
  const enderecoPatterns = [
    /(?:na|em|rua|av\.?|avenida|alameda|travessa|praça|rodovia)\s+([^,.\n]{5,80})/i,
    /(?:furto|roubo|subtração)\s+(?:de|da|na|em)\s+([^,.\n]{5,80})/i,
  ];
  for (const pattern of enderecoPatterns) {
    const match = texto.match(pattern);
    if (match) {
      resultado.endereco = match[1].trim();
      break;
    }
  }
  
  // Se nao achou endereco especifico, usa o bairro + cidade
  if (!resultado.endereco && resultado.bairro) {
    resultado.endereco = resultado.bairro + ', Balneario Camboriu, SC';
  }
  
  // Gera titulo
  const tipoVeiculo = resultado.veiculoTipo || 'Veiculo';
  const bairroStr = resultado.bairro || 'Balneario Camboriu';
  resultado.titulo = `Furto de ${tipoVeiculo} - ${bairroStr}`;
  
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
    
    // Filtra por data (ultimos N dias)
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
    
    // Conta por bairro
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

// ===== CRIAR VIA TEXTO DO WHATSAPP (admin) =====
router.post('/whatsapp', auth, async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto || texto.trim().length < 5) {
      return res.status(400).json({ error: 'Texto muito curto ou vazio' });
    }
    
    // Extrai dados do texto
    const dados = extrairDadosDoTexto(texto.trim());
    
    if (!dados.endereco) {
      return res.status(400).json({ 
        error: 'Nao foi possivel identificar o endereco no texto. Verifique se contem nome de rua, avenida ou bairro.',
        sugestao: 'Exemplo: "Furto de bike na Av. Atlantica, em frente ao P12, Barra Norte, hoje as 20h"'
      });
    }
    
    // Faz geocoding
    const geo = await geocodeEndereco(dados.endereco);
    if (!geo) {
      return res.status(400).json({ 
        error: 'Nao foi possivel localizar o endereco no mapa.',
        enderecoTentado: dados.endereco
      });
    }
    
    // Cria a ocorrencia
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
    res.status(500).json({ error: err.message });
  }
});

// ===== CRIAR MANUALMENTE (admin) =====
router.post('/', auth, async (req, res) => {
  try {
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
    const ocorrencia = await Ocorrencia.findByIdAndDelete(req.params.id);
    if (!ocorrencia) return res.status(404).json({ error: 'Ocorrencia nao encontrada' });
    res.json({ sucesso: true, message: 'Ocorrencia removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
