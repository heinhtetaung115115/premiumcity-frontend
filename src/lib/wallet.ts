import { api } from '@/lib/api';

const DEV_KEY = 'devWallet';

// Try real API; otherwise use localStorage fallback.
export async function getBalance(): Promise<number> {
  try {
    const data = await api('/me/wallet', { method: 'GET' });
    return Number(data?.balance ?? 0);
  } catch {
    if (typeof window === 'undefined') return 0;
    const raw = localStorage.getItem(DEV_KEY);
    return raw ? Number(raw) : 0;
  }
}

// For dev only — adjusts local balance when backend isn’t ready.
export async function addDevBalance(amount: number) {
  if (typeof window === 'undefined') return;
  const cur = await getBalance();
  localStorage.setItem(DEV_KEY, String(cur + amount));
  window.dispatchEvent(new CustomEvent('wallet:refresh'));
}

export async function debitDevBalance(amount: number) {
  if (typeof window === 'undefined') return;
  const cur = await getBalance();
  localStorage.setItem(DEV_KEY, String(Math.max(0, cur - amount)));
  window.dispatchEvent(new CustomEvent('wallet:refresh'));
}
