'use client';

import { ReactNode, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const me = await api('/api/wallet'); // now reads header or cookie
        setRole(me?.role || null);
      } catch (e: any) {
        setErr(e?.message || 'Not logged in');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600 text-sm">{err}</div>;
  if (role !== 'ADMIN') return <div className="p-6">Admins only.</div>;
  return <>{children}</>;
}
