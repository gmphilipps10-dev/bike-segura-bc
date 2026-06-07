const express = require('express');
const router = express.Router();

// ===== SCRAPER DE NOTICIAS DO SITE DA PREFEITURA =====
// Fonte: https://antigo.bc.sc.gov.br/imprensa.cfm (server-side rendered)
// Cache: 30 minutos

const PREFEITURA_URL = 'https://antigo.bc.sc.gov.br/imprensa.cfm';
const CACHE_TTL = 1000 * 60 * 30;

let cache = { data: null, timestamp: 0 };

function decodeHtmlEntities(text) {
  const entities = {
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
    '&atilde;': 'ã', '&otilde;': 'õ', '&ntilde;': 'ñ', '&Atilde;': 'Ã', '&Otilde;': 'Õ',
    '&acirc;': 'â', '&ecirc;': 'ê', '&icirc;': 'î', '&ocirc;': 'ô', '&ucirc;': 'û',
    '&ccedil;': 'ç', '&Ccedil;': 'Ç', '&agrave;': 'à', '&Agrave;': 'À',
    '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>',
    '&nbsp;': ' ', '&rsquo;': "'", '&lsquo;': "'", '&rdquo;': '"', '&ldquo;': '"',
    '&mdash;': '—', '&ndash;': '-', '&hellip;': '...',
  };
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
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

    // Padrao 1: Links com ID na imprensa.cfm
    // <a href="imprensa.cfm?id=XXXXX">TITULO</a>
    const padrao1 = /<a[^>]*href="([^"]*imprensa\.cfm\?id=\d+)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    while ((match = padrao1.exec(html)) !== null) {
      const href = match[1];
      const titulo = match[2].trim();
      if (titulo.length < 10 || vistos.has(titulo)) continue;
      vistos.add(titulo);

      let url = href;
      if (!url.startsWith('http')) url = 'https://antigo.bc.sc.gov.br/' + (href.startsWith('/') ? href.slice(1) : href);

      noticias.push({
        titulo: decodeHtmlEntities(titulo),
        categoria: 'Notícias BC',
        url,
        fonte: 'Prefeitura de Balneário Camboriú / BC Digital',
        data: new Date().toISOString(),
      });
    }

    // Padrao 2: Links com conteudo.cfm
    // <a href="conteudo.cfm?caminho=...">TITULO</a>
    if (noticias.length === 0) {
      const padrao2 = /<a[^>]*href="([^"]*conteudo\.cfm[^"]*)"[^>]*>([^<]+)<\/a>/gi;
      while ((match = padrao2.exec(html)) !== null) {
        const href = match[1];
        const titulo = match[2].trim();
        if (titulo.length < 10 || vistos.has(titulo)) continue;
        vistos.add(titulo);

        let url = href;
        if (!url.startsWith('http')) url = 'https://antigo.bc.sc.gov.br/' + (href.startsWith('/') ? href.slice(1) : href);

        noticias.push({
          titulo: decodeHtmlEntities(titulo),
          categoria: 'Notícias BC',
          url,
          fonte: 'Prefeitura de Balneário Camboriú / BC Digital',
          data: new Date().toISOString(),
        });
      }
    }

    // Padrao 3: Qualquer link com texto de noticia
    if (noticias.length === 0) {
      const padrao3 = /<a[^>]*href="([^"]*\.(?:cfm|html)[^"]*)"[^>]*>([^<]{20,200})<\/a>/gi;
      while ((match = padrao3.exec(html)) !== null) {
        const titulo = match[2].trim();
        if (titulo.length < 15 || titulo.length > 200 || vistos.has(titulo)) continue;
        vistos.add(titulo);
        noticias.push({
          titulo: decodeHtmlEntities(titulo),
          categoria: 'Notícias BC',
          url: 'https://antigo.bc.sc.gov.br/imprensa.cfm',
          fonte: 'Prefeitura de Balneário Camboriú / BC Digital',
          data: new Date().toISOString(),
        });
      }
    }

    return noticias.slice(0, 10);

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
