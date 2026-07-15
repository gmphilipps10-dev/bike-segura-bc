import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiGet } from '../config/api';

const STORAGE_KEY = 'bike_segura_partner_store';
const TTL_DAYS = 30;

type StoredPartnerStore = {
  codigo_parceiro: string;
  nome_fantasia: string;
  captured_at: string;
  expires_at: string;
};

function nowTime() {
  return Date.now();
}

function buildExpiration() {
  return new Date(nowTime() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function getStoredPartnerStore(): StoredPartnerStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPartnerStore;
    if (!parsed?.codigo_parceiro || !parsed?.expires_at) return null;
    if (new Date(parsed.expires_at).getTime() <= nowTime()) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function getStoredPartnerCode() {
  return getStoredPartnerStore()?.codigo_parceiro || '';
}

function persistPartnerStore(data: StoredPartnerStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function usePartnerStoreTracking() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/institucional' || location.pathname.startsWith('/institucional/')) return;
    if (location.pathname === '/forcasdeseguranca' || location.pathname.startsWith('/forcasdeseguranca/')) return;

    getStoredPartnerStore();

    const params = new URLSearchParams(location.search);
    const codigo = String(params.get('loja') || '').trim();
    if (!codigo) return;

    let cancelled = false;
    apiGet(`/partner-stores/validar/${encodeURIComponent(codigo)}`)
      .then(data => {
        if (cancelled || !data?.valid || !data?.codigo_parceiro) return;
        persistPartnerStore({
          codigo_parceiro: data.codigo_parceiro,
          nome_fantasia: data.nome_fantasia || '',
          captured_at: new Date().toISOString(),
          expires_at: buildExpiration(),
        });
      })
      .catch(() => {
        // Codigo invalido nao interrompe a navegacao do cliente.
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search]);
}
