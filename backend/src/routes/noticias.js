const express = require('express');
const router = express.Router();

// ===== SCRAPER DE NOTICIAS DA PREFEITURA =====
// Fonte: http://balneariocamboriu.sc.gov.br/imprensa.cfm

const PREFEITURA_URL = 'http://balneariocamboriu.sc.gov.br/imprensa.cfm';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutos

let cache = {
  data: null,
  timestamp: 0,
};

async function scrapeNoticias() {
  try {
    const response = await fetch(PREFEITURA_URL, {
      headers: {
        'User-Agent': 'BikeSeguraBC/1.0 (Noticias Balneario Camboriu)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const noticias = [];

    // Regex para extrair noticias do HTML da prefeitura
    // Padrao: <a href="...">CATEGORIA - TITULO</a>
    // Ou: CATEGORIA - TITULO (texto puro com link)
    const linkRegex = /<a[^>]*href="([^"]*id=\d+[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const texto = match[2].trim();

      // Ignora links que nao sao noticias
      if (!href.includes('id=')) continue;
      if (texto.length < 10) continue;

      // Tenta separar categoria do titulo
      let categoria = 'Geral';
      let titulo = texto;

      const sepIndex = texto.indexOf(' - ');
      if (sepIndex > 0) {
        categoria = texto.substring(0, sepIndex).trim();
        titulo = texto.substring(sepIndex + 3).trim();
      }

      // Constroi URL completa
      let url = href;
      if (!url.startsWith('http')) {
        url = 'http://balneariocamboriu.sc.gov.br' + (href.startsWith('/') ? '' : '/') + href;
      }

      noticias.push({
        titulo,
        categoria,
        url,
        fonte: 'Prefeitura de Balneario Camboriu',
        data: new Date().toISOString(),
      });
    }

    // Se nao achou noticias via regex, tenta extrair do formato alternativo
    if (noticias.length === 0) {
      // Padrao alternativo: noticias em texto plano com categoria - titulo
      const textoRegex = /([A-Za-z\s]+)\s+-\s+([^\n]+)(?=\n|$)/g;
      while ((match = textoRegex.exec(html)) !== null) {
        const cat = match[1].trim();
        const tit = match[2].trim();
        if (cat.length > 2 && cat.length < 40 && tit.length > 10 && tit.length < 200) {
          noticias.push({
            titulo: tit,
            categoria: cat,
            url: 'http://balneariocamboriu.sc.gov.br/imprensa.cfm',
            fonte: 'Prefeitura de Balneario Camboriu',
            data: new Date().toISOString(),
          });
        }
      }
    }

    // Remove duplicados pelo titulo
    const vistos = new Set();
    const unicas = noticias.filter(n => {
      if (vistos.has(n.titulo)) return false;
      vistos.add(n.titulo);
      return true;
    });

    return unicas.slice(0, 20); // Max 20 noticias

  } catch (error) {
    console.error('[Noticias] Erro ao fazer scraping:', error.message);
    return [];
  }
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
      // Retorna cache antigo se existir, mesmo expirado
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
