import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../config/api';

export type PushStatus = 'loading' | 'supported' | 'not-supported' | 'subscribed' | 'denied' | 'error' | 'no-key';

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
  const [erroMsg, setErroMsg] = useState<string>('');

  // Carrega chave VAPID do backend
  useEffect(() => {
    let cancelled = false;
    const loadVapidKey = async () => {
      try {
        const data = await apiGet('/push/vapid-public-key');
        if (cancelled) return;
        if (data?.publicKey) {
          setVapidKey(data.publicKey);
          console.log('[Push] VAPID key carregada com sucesso');
        } else {
          setStatus('no-key');
          setErroMsg('Chave VAPID nao configurada no servidor.');
          console.warn('[Push] VAPID key nao retornada pelo servidor');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('[Push] Erro ao carregar VAPID key:', err.message || err);
        setStatus('no-key');
        setErroMsg('Servidor de push nao configurado.');
      }
    };
    loadVapidKey();
    return () => { cancelled = true; };
  }, []);

  // Verifica suporte do navegador
  useEffect(() => {
    if (!vapidKey) return;
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push] Navegador nao suporta notificacoes push');
        setStatus('not-supported');
        return;
      }
      if (Notification.permission === 'denied') {
        console.log('[Push] Permissao de notificacao foi negada');
        setStatus('denied');
        return;
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.pushManager) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            console.log('[Push] Ja esta inscrito');
            setStatus('subscribed');
          } else {
            setStatus('supported');
          }
        } else {
          setStatus('supported');
        }
      } catch (err) {
        console.error('[Push] Erro ao verificar suporte:', err);
        setStatus('error');
      }
    };
    checkSupport();
  }, [vapidKey]);

  // Registra service worker
  const ensureServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      try {
        registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('[Push] Service Worker registrado:', registration.scope);
      } catch (err) {
        console.error('[Push] Erro ao registrar SW:', err);
        return null;
      }
    }
    // Aguarda SW ativar
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        const sw = registration!.installing!;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') resolve();
        });
        setTimeout(resolve, 5000); // Timeout de 5s
      });
    }
    return registration;
  }, []);

  // Solicita permissao e faz subscribe
  const subscribe = useCallback(async (): Promise<boolean> => {
    setErroMsg('');

    if (!vapidKey) {
      setErroMsg('Chave VAPID nao disponivel. Verifique a configuracao do servidor.');
      setStatus('no-key');
      return false;
    }
    if (!token) {
      setErroMsg('Voce precisa estar logado para ativar notificacoes.');
      return false;
    }

    try {
      // 1. Solicita permissao
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[Push] Permissao negada pelo usuario');
        setStatus('denied');
        return false;
      }

      // 2. Garante service worker
      const registration = await ensureServiceWorker();
      if (!registration) {
        setErroMsg('Nao foi possivel registrar o Service Worker.');
        return false;
      }

      // 3. Subscribe no push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
      console.log('[Push] Subscribed:', subscription.endpoint.slice(0, 40) + '...');

      // 4. Extrai e envia chaves para o backend
      const p256dhRaw = subscription.getKey('p256dh');
      const authRaw = subscription.getKey('auth');
      if (!p256dhRaw || !authRaw) {
        setErroMsg('Chaves de criptografia nao disponiveis.');
        return false;
      }

      // Converte ArrayBuffer para base64 via Uint8Array
      const toBase64 = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      // 5. Envia subscription para o backend
      await apiPost('/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: toBase64(p256dhRaw),
          auth: toBase64(authRaw)
        }
      }, token);

      console.log('[Push] Subscription salva no backend');
      setStatus('subscribed');
      return true;
    } catch (error: any) {
      console.error('[Push] Erro ao subscribe:', error);
      setErroMsg(error.message || 'Erro desconhecido ao ativar notificacoes.');
      setStatus('error');
      return false;
    }
  }, [vapidKey, token, ensureServiceWorker]);

  // Cancelar subscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    setErroMsg('');
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration?.pushManager) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await apiPost('/push/unsubscribe', { endpoint: subscription.endpoint }, token);
        }
      }
      setStatus('supported');
      return true;
    } catch (error: any) {
      console.error('[Push] Erro ao unsubscribe:', error);
      setErroMsg(error.message || 'Erro ao desativar notificacoes.');
      return false;
    }
  }, [token]);

  return { status, subscribe, unsubscribe, erroMsg };
}
