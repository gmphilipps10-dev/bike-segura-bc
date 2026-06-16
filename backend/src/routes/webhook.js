const express = require('express');
const router = express.Router();
const evolutionService = require('../services/evolutionService');

// ===== WEBHOOK DA EVOLUTION API =====
// Recebe mensagens do WhatsApp automaticamente

router.post('/evolution', async (req, res) => {
  try {
    const data = req.body;

    // Log da mensagem recebida
    console.log('[Webhook Evolution] Evento recebido:', data.event);

    // Ignora eventos que não são mensagens
    if (data.event !== 'messages.upsert') {
      return res.status(200).json({ ok: true, event: data.event, processado: false });
    }

    // Processa cada mensagem
    const resultados = [];
    const mensagens = Array.isArray(data.data) ? data.data : [data.data];

    for (const msg of mensagens) {
      const resultado = await evolutionService.processarMensagem(msg);
      resultados.push(resultado);
    }

    res.status(200).json({ ok: true, processados: resultados.length, resultados });
  } catch (err) {
    console.error('[Webhook Evolution] Erro:', err);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ===== STATUS DA CONEXÃO =====
router.get('/evolution/status', async (req, res) => {
  try {
    const instancias = await evolutionService.listarInstancias();
    res.json({ ok: true, instancias });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ===== CONECTAR (gerar QR code) =====
router.post('/evolution/conectar/:nome', async (req, res) => {
  try {
    const resultado = await evolutionService.conectarInstancia(req.params.nome);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ===== DESCONECTAR =====
router.post('/evolution/desconectar/:nome', async (req, res) => {
  try {
    const resultado = await evolutionService.desconectarInstancia(req.params.nome);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ===== CRIAR INSTANCIA =====
router.post('/evolution/instancia', async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ ok: false, erro: 'Nome é obrigatório' });
    const resultado = await evolutionService.criarInstancia(nome);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ===== DELETAR INSTANCIA =====
router.delete('/evolution/instancia/:nome', async (req, res) => {
  try {
    const resultado = await evolutionService.deletarInstancia(req.params.nome);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

module.exports = router;
