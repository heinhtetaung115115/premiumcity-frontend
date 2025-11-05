// src/lib/api.ts
import { getLocalUserId } from './auth';

export async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (typeof window !== 'undefined') {
    const uid = getLocalUserId();
    if (uid) headers.set('x-user-id', uid);
  }
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, { ...init, headers, cache: 'no-store' });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(json?.error || text || 'Request failed');
  return json;
}
