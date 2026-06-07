const express = require('express');
const router = express.Router();

const PREFEITURA_URL = 'https://antigo.bc.sc.gov.br/imprensa.cfm';
const CACHE_TTL = 1000 * 60 * 30;
let cache = { data: null, timestamp: 0 };

function decodeHtmlEntities(text) {
  const entities = {
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
    '&atilde;': 'ã', '&otilde;': 'õ', '&Agrave;': 'À', '&agrave;': 'à',
    '&acirc;': 'â', '&ecirc;': 'ê', '&ocirc;': 'ô',
    '&ccedil;': 'ç', '&Ccedil;': 'Ç', '&amp;': '&', '&nbsp;': ' ',
    '&#8211;': '–', '&#8212;': '—', '&#8220;': '"', '&#8221;': '"',
  };
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) decoded = decoded.split(entity).join(char);
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return decoded;
}

async function scrapeNoticias() {
  try {
    const response = await fetch(PREFEITURA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const noticias = [];
    const vistos = new Set();

    // ESTRATEGIA 1: Procura links <a> que tem texto com " - " (CATEGORIA - TITULO)
    // e que aparecem APOS uma data no HTML
    // Regex: pega <a> com href contendo imprensa.cfm?id= ou conteudo.cfm
    const linkRegex = /<a[^>]*href="([^"]*(?:imprensa\.cfm\?id=|conteudo\.cfm)[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const texto = match[2].trim();

      // Verifica se tem formato "CATEGORIA - TITULO"
      const sepIdx = texto.indexOf(' - ');
      if (sepIdx === -1) continue;

      const categoria = texto.substring(0, sepIdx).trim();
      const titulo = texto.substring(sepIdx + 3).trim();

      // Filtros
      if (categoria.length < 3 || categoria.length > 40) continue;
      if (titulo.length < 15 || titulo.length > 200) continue;

      // Ignora falsos positivos (categorias invalidas)
      const categoriasInvalidas = ['href', 'class', 'style', 'script', 'div', 'span', 'input', 'select', 'button', 'img', 'meta', 'title', 'head', 'body', 'html', 'GrupoW', 'Softwares', 'Internet', 'Copyright', 'Todos os direitos'];
      if (categoriasInvalidas.some(c => categoria.toLowerCase().includes(c.toLowerCase()))) continue;
      if (categoriasInvalidas.some(c => titulo.toLowerCase().includes(c.toLowerCase()))) continue;

      const chave = titulo.toLowerCase();
      if (vistos.has(chave)) continue;
      vistos.add(chave);

      let url = href;
      if (!url.startsWith('http')) url = 'https://antigo.bc.sc.gov.br/' + (url.startsWith('/') ? url.slice(1) : url);

      noticias.push({
        titulo: decodeHtmlEntities(titulo),
        categoria: decodeHtmlEntities(categoria),
        url,
        fonte: 'Prefeitura de Balneario Camboriu',
        data: new Date().toISOString(),
      });

      if (noticias.length >= 8) break;
    }

    return noticias;

  } catch (error) {
    console.error('[Noticias] Erro:', error.message);
    return [];
  }
}

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
      res.json({ noticias: cache.data, cached: true, atualizado: new Date(cache.timestamp).toISOString() });
    } else {
      res.json({ noticias: [], message: 'Nenhuma noticia disponivel.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar noticias.' });
  }
});

module.exports = router;
