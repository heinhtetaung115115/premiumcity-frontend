'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getLocalUser } from '@/lib/auth';

export default function WalletBadge() {
  const [amount, setAmount] = useState<number | null>(null);

  async function load() {
    try {
      const data = await api('/api/wallet');
      setAmount(data?.walletBalance ?? 0);
    } catch {
      setAmount(null);
    }
  }

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener('wallet:refresh', onRefresh);
    window.addEventListener('storage', onRefresh);
    return () => {
      window.removeEventListener('wallet:refresh', onRefresh);
      window.removeEventListener('storage', onRefresh);
    };
  }, []);

  const user = getLocalUser();
  if (!user) return null;

  return (
    <div className="rounded-full border px-3 py-1 text-sm bg-white">
      Wallet: {amount == null ? '—' : new Intl.NumberFormat('en-MM').format(amount)} MMK
    </div>
  );
}
