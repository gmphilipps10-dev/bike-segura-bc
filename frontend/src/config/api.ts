const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api';

export async function apiGet(endpoint: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(endpoint: string, data: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPut(endpoint: string, data: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(endpoint: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      if (json.message) message = json.message;
    } catch (e) {
      // não é JSON, usa o texto direto
    }
    throw new Error(message);
  }
  // Alguns DELETE retornam 204 (sem corpo), então não fazemos res.json() automaticamente
  const text = await res.text();
  return text ? JSON.parse(text) : { success: true };
}
