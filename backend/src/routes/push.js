const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// ===== VAPID CONFIG =====
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@bikesegurabc.com.br';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ===== MIDDLEWARE DE AUTH =====
const userAuth = async (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token nao fornecido.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch { res.status(401).json({ message: 'Token invalido.' }); }
};

// ===== OBTER CHAVE PUBLICA VAPID =====
router.get('/vapid-public-key', (req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(500).json({ message: 'VAPID_PUBLIC_KEY nao configurada' });
  }
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// ===== REGISTRAR SUBSCRIPTION =====
router.post('/subscribe', userAuth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Dados de subscription incompletos.' });
    }

    // Upsert: se ja existe, reativa; se nao, cria
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.userId, endpoint, keys, ativo: true },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Notificacoes ativadas.' });
  } catch (error) {
    console.error('[Push Subscribe] Erro:', error);
    res.status(500).json({ message: 'Erro ao registrar subscription.' });
  }
});

// ===== DESREGISTRAR SUBSCRIPTION =====
router.post('/unsubscribe', userAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.findOneAndUpdate(
      { endpoint, userId: req.userId },
      { ativo: false }
    );
    res.json({ success: true, message: 'Notificacoes desativadas.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro.' });
  }
});

// ===== ENVIAR NOTIFICACAO DE FURTO (interno) =====
async function notificarFurto(bike, userId) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID nao configurado. Notificacao nao enviada.');
    return;
  }

  try {
    // Busca TODAS as subscriptions ativas (toda a comunidade)
    const subscriptions = await PushSubscription.find({ ativo: true });
    if (subscriptions.length === 0) {
      console.log('[Push] Nenhuma subscription ativa.');
      return;
    }

    const payload = JSON.stringify({
      title: '🚨 BIKE FURTADA',
      body: `${bike.name} - ${bike.brand} (${bike.color})`,
      icon: '/logo-oficial.jpg',
      badge: '/favicon.png',
      tag: `furto-${bike._id}`,
      data: {
        url: `/s/${bike.stickerNumber || bike.hash}`,
        bikeName: bike.name,
        bikeHash: bike.hash,
        tipo: 'furto'
      },
      actions: [
        { action: 'ver', title: 'Ver detalhes' },
        { action: 'fechar', title: 'Fechar' }
      ]
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        )
      )
    );

    const sucessos = results.filter(r => r.status === 'fulfilled').length;
    const falhas = results.filter(r => r.status === 'rejected').length;

    // Remove subscriptions invalidas (expiradas)
    const invalidas = subscriptions.filter((_, i) => results[i].status === 'rejected');
    if (invalidas.length > 0) {
      await PushSubscription.deleteMany({
        endpoint: { $in: invalidas.map(s => s.endpoint) }
      });
      console.log(`[Push] ${invalidas.length} subscriptions invalidas removidas.`);
    }

    console.log(`[Push] Furto notificado: ${sucessos} sucessos, ${falhas} falhas (${subscriptions.length} total)`);
  } catch (error) {
    console.error('[Push] Erro ao notificar furto:', error.message);
  }
}

module.exports = { router, notificarFurto };
