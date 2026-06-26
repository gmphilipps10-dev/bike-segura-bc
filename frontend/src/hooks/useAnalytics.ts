import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api';
const VISITOR_ID_KEY = 'bike_segura_visitor_id';

type AnalyticsEventType = 'app_open' | 'page_view' | 'button_click';

function getVisitorId() {
  try {
    const stored = localStorage.getItem(VISITOR_ID_KEY);
    if (stored) return stored;

    const generated = globalThis.crypto?.randomUUID?.()
      || `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(VISITOR_ID_KEY, generated);
    return generated;
  } catch {
    return `anon_${Date.now().toString(36)}`;
  }
}

function cleanLabel(value: string | null | undefined) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function getButtonLabel(element: Element) {
  const explicit = element.getAttribute('data-analytics-button');
  if (explicit) return cleanLabel(explicit);

  return cleanLabel(
    element.getAttribute('aria-label')
    || element.getAttribute('title')
    || element.textContent
    || element.getAttribute('href')
    || 'clique'
  );
}

function sendAnalyticsEvent(
  eventType: AnalyticsEventType,
  page: string,
  token: string | null,
  button?: string
) {
  const body = JSON.stringify({
    event_type: eventType,
    page,
    button_name: button,
    anonymous_id: token ? undefined : getVisitorId(),
  });

  fetch(`${API_BASE_URL}/analytics/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics nunca deve atrapalhar a experiencia do usuario.
  });
}

export function useAnalyticsTracker() {
  const location = useLocation();
  const { token } = useAuth();
  const tokenRef = useRef(token);
  const locationRef = useRef(location);
  const appOpenSentRef = useRef(false);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    if (appOpenSentRef.current) return;
    appOpenSentRef.current = true;
    const page = `${locationRef.current.pathname}${locationRef.current.search}`;
    sendAnalyticsEvent('app_open', page || '/', tokenRef.current);
  }, []);

  useEffect(() => {
    const page = `${location.pathname}${location.search}`;
    sendAnalyticsEvent('page_view', page || '/', tokenRef.current);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const clickable = target.closest('button, a, [data-analytics-button]');
      if (!clickable) return;

      const button = getButtonLabel(clickable);
      if (!button) return;

      const page = `${locationRef.current.pathname}${locationRef.current.search}`;
      sendAnalyticsEvent('button_click', page || '/', tokenRef.current, button);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);
}
