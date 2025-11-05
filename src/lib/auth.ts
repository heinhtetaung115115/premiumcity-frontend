// src/lib/auth.ts
export type LocalUser = { id: string; email?: string; role?: string };

export function getLocalUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getLocalUserId(): string | null {
  return getLocalUser()?.id || null;
}
