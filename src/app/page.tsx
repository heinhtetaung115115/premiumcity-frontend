'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Listing = {
  id: string;
  title: string;
  slug: string;
  description: string;
  deliveryType: 'CODE' | 'ACCOUNT' | 'TEXT';
  minPrice: number | null;
  totalUnallocated: number;
};

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Listing[]>([]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setItems(data.items ?? []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Products</h1>

      {loading && <div>Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {!loading && !items.length && <div>No products yet.</div>}

      <div className="grid gap-4 md:grid-cols-3">
        {items.map(p => (
          <div key={p.id} className="rounded-xl border bg-white p-4">
            <div className="font-medium">{p.title}</div>
            {p.description && (
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{p.description}</p>
            )}

            <div className="mt-2 text-sm text-neutral-700">
              {p.minPrice != null
                ? <>From <b>{new Intl.NumberFormat('en-MM').format(p.minPrice)} MMK</b></>
                : <>No active variants</>}
              {' · '}
              {p.totalUnallocated > 0 ? (
                <span>In stock ({p.totalUnallocated})</span>
              ) : (
                <span>Out of stock</span>
              )}
            </div>

            <div className="mt-3">
              {/* Link to PAGE route */}
              <Link href={`/product/${p.slug}`} className="inline-block rounded bg-neutral-900 px-3 py-1 text-white">
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
