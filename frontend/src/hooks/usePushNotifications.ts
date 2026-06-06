import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../config/api';

const API_BASE = '/bike-segura-bc-backend/api';

export type PushStatus = 'loading' | 'supported' | 'not-supported' | 'subscribed' | 'denied' | 'error';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(token: string | null) {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [vapidKey, setVapidKey] = useState<string>('');

  // Carrega chave VAPID
  useEffect(() => {
    fetch(`${API_BASE}/push/vapid-public-key`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.publicKey) {
          setVapidKey(data.publicKey);
        }
      })
      .catch(() => {});
  }, []);

  // Verifica suporte e status
  useEffect(() => {
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('not-supported');
        return;
      }

      if (Notification.permission === 'denied') {
        setStatus('denied');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.pushManager) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setStatus('subscribed');
          } else {
            setStatus('supported');
          }
        } else {
          setStatus('supported');
        }
      } catch {
        setStatus('error');
      }
    };

    checkSupport();
  }, []);

  // Registra service worker se necessario
  const ensureServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;

    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      try {
        registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('[Push] SW registrado:', registration.scope);
      } catch (err) {
        console.error('[Push] Erro ao registrar SW:', err);
        return null;
      }
    }
    return registration;
  }, []);

  // Solicitar permissao e fazer subscribe
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!vapidKey || !token) {
      console.warn('[Push] Chave VAPID ou token nao disponivel.');
      return false;
    }

    try {
      // 1. Solicita permissao
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return false;
      }

      // 2. Garante service worker
      const registration = await ensureServiceWorker();
      if (!registration) return false;

      // 3. Aguarda SW ativar
      if (registration.installing) {
        await new Promise<void>(resolve => {
          registration.installing!.addEventListener('statechange', () => {
            if (registration.active) resolve();
          });
          // Timeout fallback
          setTimeout(resolve, 3000);
        });
      }

      // 4. Subscribe no push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      // 5. Envia subscription para o backend
      await apiPost('/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        }
      }, token);

      setStatus('subscribed');
      return true;
    } catch (error) {
      console.error('[Push] Erro ao subscribe:', error);
      setStatus('error');
      return false;
    }
  }, [vapidKey, token, ensureServiceWorker]);

  // Cancelar subscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.pushManager) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await apiPost('/push/unsubscribe', {
            endpoint: subscription.endpoint
          }, token);
        }
      }
      setStatus('supported');
      return true;
    } catch (error) {
      console.error('[Push] Erro ao unsubscribe:', error);
      return false;
    }
  }, [token]);

  return { status, subscribe, unsubscribe };
}
