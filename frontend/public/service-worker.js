// Service Worker - Bike Segura BC
// Recebe notificacoes push e as exibe ao usuario

const CACHE_NAME = 'bike-segura-bc-v1';

// ===== INSTALL =====
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado');
  self.skipWaiting();
});

// ===== ACTIVATE =====
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// ===== PUSH RECEBIDO =====
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'Bike Segura BC',
      body: 'Voce recebeu uma notificacao.',
      icon: '/logo-oficial.jpg',
      badge: '/favicon.png'
    };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-oficial.jpg',
    badge: data.badge || '/favicon.png',
    tag: data.tag || 'default',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Bike Segura BC', options)
  );
});

// ===== CLIQUE NA NOTIFICACAO =====
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clique na notificacao:', event.action, event.notification);

  event.notification.close();

  const notificationData = event.notification.data;
  let url = '/';

  if (notificationData?.url) {
    url = notificationData.url;
  } else if (notificationData?.bikeHash) {
    url = `/#/qr/${notificationData.bikeHash}`;
  }

  // Abre ou foca a aba do app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Tenta focar uma aba existente
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Se nao achou, abre nova aba
      return self.clients.openWindow(url);
    })
  );
});

// ===== FETCH (cache basico) =====
self.addEventListener('fetch', (event) => {
  // Por enquanto, apenas passa adiante (network-first)
  // Pode ser expandido para cache de assets estaticos
  event.respondWith(fetch(event.request));
});
