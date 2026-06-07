const express = require('express');
const router = express.Router();

// ===== SCRAPER DE NOTICIAS DO SITE DA PREFEITURA =====
// Fonte: https://antigo.bc.sc.gov.br/imprensa.cfm
// Cache: 30 minutos

const PREFEITURA_URL = 'https://antigo.bc.sc.gov.br/imprensa.cfm';
const CACHE_TTL = 1000 * 60 * 30;

let cache = { data: null, timestamp: 0 };

function decodeHtmlEntities(text) {
  const entities = {
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
    '&atilde;': 'ã', '&otilde;': 'õ', '&Atilde;': 'Ã', '&Otilde;': 'Õ',
    '&acirc;': 'â', '&ecirc;': 'ê', '&ocirc;': 'ô',
    '&ccedil;': 'ç', '&Ccedil;': 'Ç',
    '&amp;': '&', '&quot;': '"', '&nbsp;': ' ',
    '&#8211;': '–', '&#8212;': '—', '&#8220;': '"', '&#8221;': '"', '&#8230;': '...',
  };
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }
  return decoded;
}

async function scrapeNoticias() {
  try {
    const response = await fetch(PREFEITURA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const noticias = [];
    const vistos = new Set();

    // Estratégia: separar por datas e extrair noticias
    // O HTML tem formato: "15/05/26" seguido de links de noticias
    // Cada noticia: "Categoria - Titulo da noticia"

    // Regex para linhas que tem formato "Categoria - Titulo"
    // Ex: "BC Transito - Bairro Nova Esperanca tera alteracao viaria"
    // Ex: "Cultura - Teatro Bruno Nitz recebe espetaculo"
    const padrao = /([A-Za-zÀ-ÖØ-öø-ÿ\s]+)\s+-\s+([A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,:;!?'"\-–—()]+[A-Za-zÀ-ÖØ-öø-ÿ])/g;

    let match;
    while ((match = padrao.exec(html)) !== null) {
      const categoria = match[1].trim();
      const titulo = match[2].trim();

      // Validação: categoria deve ter 2-40 chars, titulo 15-200
      if (categoria.length < 2 || categoria.length > 40) continue;
      if (titulo.length < 15 || titulo.length > 200) continue;

      // Evita duplicados e falsos positivos
      const chave = titulo.toLowerCase();
      if (vistos.has(chave)) continue;

      // Filtra falsos positivos (palavras que não são categorias)
      const falsos = ['href', 'class', 'style', 'script', 'div', 'span', 'table', 'input', 'select', 'option', 'button', 'img', 'meta', 'title', 'link', 'head', 'body'];
      if (falsos.some(f => categoria.toLowerCase().includes(f))) continue;

      vistos.add(chave);

      noticias.push({
        titulo: decodeHtmlEntities(titulo),
        categoria: decodeHtmlEntities(categoria),
        url: 'https://antigo.bc.sc.gov.br/imprensa.cfm',
        fonte: 'Prefeitura de Balneario Camboriu',
        data: new Date().toISOString(),
      });

      if (noticias.length >= 10) break;
    }

    // Se ainda nao achou, tenta extrair do texto plano (sem HTML)
    if (noticias.length === 0) {
      // Remove tags HTML
      const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

      // Procura por padrao de data seguido de texto
      const dataPadrao = /\d{2}\/\d{2}\/\d{2,4}\s+([A-Z][A-Za-zÀ-ÖØ-öø-ÿ\s]+\s+-\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,:;!?'"()–—\-]{15,200})/g;

      while ((match = dataPadrao.exec(texto)) !== null) {
        const linha = match[1].trim();
        const sepIdx = linha.indexOf(' - ');
        if (sepIdx === -1) continue;

        const categoria = linha.substring(0, sepIdx).trim();
        const titulo = linha.substring(sepIdx + 3).trim();

        if (categoria.length < 2 || categoria.length > 40) continue;
        if (titulo.length < 15 || titulo.length > 200) continue;

        const chave = titulo.toLowerCase();
        if (vistos.has(chave)) continue;
        vistos.add(chave);

        noticias.push({
          titulo: decodeHtmlEntities(titulo),
          categoria: decodeHtmlEntities(categoria),
          url: 'https://antigo.bc.sc.gov.br/imprensa.cfm',
          fonte: 'Prefeitura de Balneario Camboriu',
          data: new Date().toISOString(),
        });

        if (noticias.length >= 10) break;
      }
    }

    return noticias;

  } catch (error) {
    console.error('[Noticias] Erro ao fazer scraping:', error.message);
    return [];
  }
}

// ===== GET /api/noticias =====
router.get('/', async (req, res) => {
  try {
    const agora = Date.now();
    if (cache.data && (agora - cache.timestamp) < CACHE_TTL) {
      return res.json({ noticias: cache.data, cached: true, atualizado: new Date(cache.timestamp).toISOString() });
    }

    const noticias = await scrapeNoticias();

    if (noticias.length > 0) {
      cache = { data: noticias, timestamp: agora };
      res.json({ noticias, cached: false, atualizado: new Date().toISOString() });
    } else if (cache.data) {
      res.json({ noticias: cache.data, cached: true, atualizado: new Date(cache.timestamp).toISOString(), aviso: 'Dados em cache' });
    } else {
      res.json({ noticias: [], message: 'Nenhuma noticia disponivel.' });
    }
  } catch (error) {
    console.error('[Noticias] Erro:', error.message);
    res.status(500).json({ message: 'Erro ao carregar noticias.' });
  }
});

module.exports = router;
