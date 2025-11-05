'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type ProductLite = {
  id: string;
  title: string;
  slug: string;
  deliveryType: 'CODE' | 'ACCOUNT' | 'TEXT';
  active: boolean;
} | null;

type VariantLite = {
  id: string;
  title: string;
  price: number;
  active: boolean;
  months?: number | null;
  productId: string;
};

export default function VariantStockPage() {
  const params = useParams<{ variantId: string }>();
  const variantId = useMemo(() => (params?.variantId ?? '').toString(), [params]);

  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<VariantLite | null>(null);
  const [product, setProduct] = useState<ProductLite>(null);
  const [unallocated, setUnallocated] = useState<number>(0);
  const [err, setErr] = useState<string | null>(null);

  // Paste/CSV states
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function loadMeta() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/variants/id/${encodeURIComponent(variantId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load variant');
      setVariant(data.variant ?? null);
      setProduct(data.product ?? null);
      setUnallocated(data.stock?.unallocated ?? 0);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
      setVariant(null);
      setProduct(null);
      setUnallocated(0);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUnallocated() {
    try {
      const res = await fetch(`/api/variants/id/${encodeURIComponent(variantId)}/stock`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Stock load failed');
      setUnallocated(j?.unallocated ?? 0);
    } catch {}
  }

  async function clearUnallocated() {
    if (!confirm('Delete ALL unallocated stock items for this variant?')) return;
    try {
      const res = await fetch(`/api/variants/id/${encodeURIComponent(variantId)}/stock/unallocated`, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed to delete');
      await refreshUnallocated();
      setStatus('Unallocated stock cleared.');
    } catch (e: any) {
      setStatus(e?.message || 'Failed to clear');
    }
  }

  async function uploadPasted() {
    if (!text.trim()) { setStatus('Paste some lines first.'); return; }
    setUploading(true);
    setStatus(null);
    try {
      const j = await api(`/api/variants/id/${encodeURIComponent(variantId)}/stock/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      setStatus(`Uploaded ${j?.count ?? 0} rows`);
      setText('');
      await refreshUnallocated();
    } catch (e: any) {
      setStatus(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function uploadCSV() {
    if (!file) { setStatus('Choose a CSV file first.'); return; }
    setUploading(true);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const j = await api(`/api/variants/id/${encodeURIComponent(variantId)}/stock/bulk`, {
        method: 'POST',
        body: fd,
      });
      setStatus(`Uploaded ${j?.count ?? 0} rows`);
      setFile(null);
      await refreshUnallocated();
    } catch (e: any) {
      setStatus(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => { if (variantId) loadMeta(); }, [variantId]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-sm text-red-600">{err}</div>;
  if (!variant) return <div className="p-6">Variant not found.</div>;

  const priceFmt = new Intl.NumberFormat('en-MM').format(variant.price);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500">
            {product ? (
              <>
                Product:{' '}
                <Link href={`/admin/products/${product.id}`} className="underline">
                  {product.title}
                </Link>{' '}
                • {product.deliveryType}
              </>
            ) : (
              'Product: (unknown)'
            )}
          </div>
          <h1 className="text-2xl font-semibold">
            Variant stock — {variant.title} ({priceFmt} MMK)
          </h1>
        </div>
        <Link href="/admin/products" className="underline">Back to products</Link>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>Unallocated stock: <strong>{unallocated}</strong></div>
          <button onClick={refreshUnallocated} className="rounded border px-3 py-1">Refresh</button>
          <button onClick={clearUnallocated} className="rounded bg-red-600 text-white px-3 py-1">
            Delete all unallocated
          </button>
        </div>

        <hr />

        {/* PASTE BOX */}
        <div className="space-y-2">
          <div className="font-medium">Paste lines (mobile-friendly)</div>
          <p className="text-sm text-neutral-600">
            Use comma, tab, semicolon or pipe separators. Supported formats:
          </p>
          <ul className="text-sm list-disc ml-5 space-y-1 text-neutral-700">
            <li><b>CODE</b>: <code>CODE123,optional note</code></li>
            <li><b>ACCOUNT</b>: <code>email@example.com,password,optional note</code></li>
            <li><b>TEXT</b>: <code>some text,optional note</code></li>
          </ul>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={
              product?.deliveryType === 'ACCOUNT'
                ? 'acc1@example.com,pass123,Main profile only\nacc2@example.com,pass456,This is test'
                : product?.deliveryType === 'CODE'
                ? 'CODE-AAAA-1111,First batch\nCODE-BBBB-2222,Second batch'
                : 'Activation message 1,Note\nActivation message 2'
            }
            className="w-full rounded border px-3 py-2"
          />
          <button
            onClick={uploadPasted}
            disabled={uploading}
            className="rounded bg-neutral-900 text-white px-3 py-1 disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Upload pasted lines'}
          </button>
        </div>

        <hr />

        {/* CSV UPLOAD (optional) */}
        <div className="space-y-2">
          <div className="font-medium">Or upload CSV</div>
          <p className="text-sm text-neutral-600">
            CSV columns depend on delivery type:
            <b> CODE</b> <code>code,note</code>,
            <b> ACCOUNT</b> <code>email,password,note</code>,
            <b> TEXT</b> <code>text,note</code>
          </p>
          <div className="flex items-center gap-3">
            <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button
              onClick={uploadCSV}
              disabled={!file || uploading}
              className="rounded bg-neutral-900 text-white px-3 py-1 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Upload CSV'}
            </button>
            {file && <span className="text-sm text-neutral-600">{file.name}</span>}
          </div>
        </div>

        {status && <div className="text-sm">{status}</div>}
      </div>
    </div>
  );
}
