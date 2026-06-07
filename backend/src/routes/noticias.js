const express = require('express');
const router = express.Router();

// ===== SCRAPER DE NOTICIAS DO SITE DA PREFEITURA =====
// Fonte: https://bc.sc.gov.br/noticias (site oficial da Prefeitura de BC)
// Também disponível no app BC Digital

const PREFEITURA_URL = 'https://bc.sc.gov.br/noticias';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutos

let cache = {
  data: null,
  timestamp: 0,
};

async function scrapeNoticias() {
  try {
    const response = await fetch(PREFEITURA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const noticias = [];

    // Padrao 1: Noticias em cards com link <a href="/noticia/XXXX">
    // Format: <a href="/noticia/42869"><...><h2>TITULO</h2></a>
    const cardRegex = /<a[^>]*href="(\/noticia\/\d+)"[^>]*>.*?<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
    let match;
    const vistos = new Set();

    while ((match = cardRegex.exec(html)) !== null) {
      const path = match[1];
      const titulo = match[2].trim();

      if (titulo.length < 10 || vistos.has(titulo)) continue;
      vistos.add(titulo);

      noticias.push({
        titulo: decodeHtmlEntities(titulo),
        categoria: 'Notícias BC',
        url: `https://bc.sc.gov.br${path}`,
        fonte: 'Prefeitura de Balneário Camboriú / BC Digital',
        data: new Date().toISOString(),
      });
    }

    // Padrao 2: Noticias em formato de lista com h2
    // Format: <h2>TITULO</h2> dentro de <a href="/noticia/XXXX">
    if (noticias.length === 0) {
      const h2Regex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
      while ((match = h2Regex.exec(html)) !== null) {
        const titulo = match[1].trim();
        if (titulo.length > 15 && titulo.length < 200 && !vistos.has(titulo)) {
          vistos.add(titulo);
          noticias.push({
            titulo: decodeHtmlEntities(titulo),
            categoria: 'Notícias BC',
            url: 'https://bc.sc.gov.br/noticias',
            fonte: 'Prefeitura de Balneário Camboriú / BC Digital',
            data: new Date().toISOString(),
          });
        }
      }
    }

    return noticias.slice(0, 10);

  } catch (error) {
    console.error('[Noticias] Erro ao fazer scraping:', error.message);
    return [];
  }
}

// Decodifica entidades HTML
function decodeHtmlEntities(text) {
  const entities = {
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
    '&atilde;': 'ã', '&otilde;': 'õ', '&ntilde;': 'ñ',
    '&Atilde;': 'Ã', '&Otilde;': 'Õ', '&Ntilde;': 'Ñ',
    '&acirc;': 'â', '&ecirc;': 'ê', '&icirc;': 'î', '&ocirc;': 'ô', '&ucirc;': 'û',
    '&ccedil;': 'ç', '&Ccedil;': 'Ç',
    '&agrave;': 'à', '&egrave;': 'è', '&igrave;': 'ì', '&ograve;': 'ò', '&ugrave;': 'ù',
    '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>',
    '&#x27;': "'", '&#x2F;': '/', '&#x3D;': '=', '&nbsp;': ' ',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }

  // Decodifica entidades numericas (&#123;)
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));

  // Decodifica entidades hexadecimais (&#x7B;)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
}

// ===== GET /api/noticias =====
router.get('/', async (req, res) => {
  try {
    // Verifica cache
    const agora = Date.now();
    if (cache.data && (agora - cache.timestamp) < CACHE_TTL) {
      return res.json({
        noticias: cache.data,
        cached: true,
        atualizado: new Date(cache.timestamp).toISOString(),
      });
    }

    // Faz scraping
    const noticias = await scrapeNoticias();

    if (noticias.length > 0) {
      cache = { data: noticias, timestamp: agora };
      res.json({
        noticias,
        cached: false,
        atualizado: new Date().toISOString(),
      });
    } else {
      // Retorna cache antigo se existir
      if (cache.data) {
        res.json({
          noticias: cache.data,
          cached: true,
          atualizado: new Date(cache.timestamp).toISOString(),
          aviso: 'Dados do cache - servico temporariamente indisponivel',
        });
      } else {
        res.json({
          noticias: [],
          message: 'Nenhuma noticia disponivel no momento.',
        });
      }
    }
  } catch (error) {
    console.error('[Noticias] Erro:', error.message);
    res.status(500).json({ message: 'Erro ao carregar noticias.' });
  }
});

module.exports = router;
