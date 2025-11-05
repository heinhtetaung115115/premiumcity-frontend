'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

type Variant = {
  id: string;
  title: string;
  price: number;
  months?: number | null;
  unallocated: number;
};

type ProductPayload = {
  id: string;
  title: string;
  slug: string;
  description: string;
  deliveryType: 'CODE' | 'ACCOUNT' | 'TEXT';
  variants: Variant[];
};

export default function ProductPage() {
  const params = useParams();
  const slug = useMemo(() => {
    const raw = (params as any)?.slug;
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw) && raw.length) return raw[0];
    return '';
  }, [params]);

  const router = useRouter();
  const q = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [variantId, setVariantId] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    if (!slug) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setProduct(data);
      const want = q.get('variant');
      const byQuery = data.variants.find((v: Variant) => v.id === want);
      const withStock = data.variants.find((v: Variant) => v.unallocated > 0);
      setVariantId(byQuery?.id || withStock?.id || data.variants[0]?.id || '');
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  const selected = product?.variants.find(v => v.id === variantId);
  const canBuy = !!selected && selected.unallocated > 0 && qty > 0;
  const total = selected ? selected.price * Math.max(1, qty) : 0;

  async function buy() {
    if (!selected) return;
    setBusy(true);
    setStatus(null);
    try {
      await api('/api/checkout/purchase', {
        method: 'POST',
        body: JSON.stringify({ variantId: selected.id, qty: Math.max(1, qty) }),
      });
      router.push('/orders');
    } catch (e: any) {
      setStatus(e?.message || 'Purchase failed');
    } finally {
      setBusy(false);
    }
  }

  if (!slug) return <div className="container mx-auto max-w-3xl px-4 py-6">Loading…</div>;
  if (loading) return <div className="container mx-auto max-w-3xl px-4 py-6">Loading…</div>;
  if (err) return <div className="container mx-auto max-w-3xl px-4 py-6 text-red-600">{err}</div>;
  if (!product) return null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">{product.title}</h1>
      {product.description && <p className="text-neutral-700">{product.description}</p>}

      <div className="space-y-3 rounded-xl border bg-white p-4">
        <div>
          <div className="mb-1 font-medium">Choose plan</div>
          <div className="grid gap-2 md:grid-cols-2">
            {product.variants.map(v => (
              <label key={v.id} className={`cursor-pointer rounded border p-3 ${variantId === v.id ? 'ring-2 ring-neutral-900' : ''}`}>
                <input
                  type="radio"
                  name="variant"
                  className="mr-2"
                  checked={variantId === v.id}
                  onChange={() => setVariantId(v.id)}
                />
                <span className="font-medium">{v.title}</span>
                <span className="ml-2 text-sm text-neutral-500">
                  {new Intl.NumberFormat('en-MM').format(v.price)} MMK
                </span>
                <span className="ml-2 text-sm">
                  {v.unallocated > 0 ? `• In stock (${v.unallocated})` : '• Out of stock'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm">Qty</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
            className="w-24 rounded border px-3 py-1"
          />
          <div className="ml-auto font-medium">
            Total: {new Intl.NumberFormat('en-MM').format(total)} MMK
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={buy}
            disabled={!canBuy || busy}
            className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {busy ? 'Processing…' : 'Buy now'}
          </button>
          {status && <div className="text-sm">{status}</div>}
        </div>
      </div>
    </div>
  );
}
