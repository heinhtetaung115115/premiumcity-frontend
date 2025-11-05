'use client';

import { useEffect, useState } from 'react';
import CopyField from '@/components/CopyField';

type OrderItem = {
  code?: string | null;
  email?: string | null;
  password?: string | null;
  text?: string | null;
  note?: string | null;
};

type Order = {
  id: string;
  productTitle: string;
  deliveryType: 'CODE' | 'ACCOUNT' | 'TEXT';
  createdAt: string;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setOrders(data.items || []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Orders</h1>

      {loading && <div>Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !orders.length && <div>No orders yet.</div>}

      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{o.productTitle}</div>
            <div className="text-sm text-neutral-500">
              {new Date(o.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="text-sm text-neutral-600">Delivery: {o.deliveryType}</div>

          <div className="space-y-2">
            {o.items.map((it, idx) => (
              <div key={idx} className="rounded border p-3">
                {o.deliveryType === 'ACCOUNT' && (
                  <div className="grid gap-2 md:grid-cols-2">
                    <CopyField label="Email" value={it.email || ''} />
                    <CopyField label="Password" value={it.password || ''} />
                    {it.note && <div className="text-sm text-neutral-600 md:col-span-2">Note: {it.note}</div>}
                  </div>
                )}

                {o.deliveryType === 'CODE' && (
                  <div className="grid gap-2">
                    <CopyField label="Code" value={it.code || ''} />
                    {it.note && <div className="text-sm text-neutral-600">Note: {it.note}</div>}
                  </div>
                )}

                {o.deliveryType === 'TEXT' && (
                  <div className="grid gap-2">
                    <CopyField label="Text" value={it.text || ''} />
                    {it.note && <div className="text-sm text-neutral-600">Note: {it.note}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
