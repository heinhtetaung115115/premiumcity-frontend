'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Product = { id: string; title: string; deliveryType: 'CODE' | 'ACCOUNT' | 'TEXT' };
type PreviewRow = { id: string; code?: string | null; email?: string | null; password?: string | null; note?: string | null; text?: string | null; };
type StockResponse = { product: Product; total: number; allocated: number; unallocated: number; preview: PreviewRow[]; };

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(json?.error || text || 'Request failed');
  return json;
}

export default function AdminProductStock() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

  const [data, setData] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load(realId: string) {
    setLoading(true);
    setErr(null);
    try {
      const d = await api(`/api/products/id/${realId}/stock`);
      setData(d);
    } catch (e: any) {
      setErr(e?.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return; // wait until id exists
    load(id);
  }, [id]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (!fileRef.current?.files?.[0]) return alert('Choose a CSV file first.');
    setUploading(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append('file', fileRef.current.files[0]);
      const res = await fetch(`/api/products/id/${id}/stock/bulk`, { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Upload failed');
      await load(id);
      if (fileRef.current) fileRef.current.value = '';
      alert(`Inserted ${json.inserted} rows`);
    } catch (e: any) {
      setErr(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function clearUnallocated() {
    if (!id) return;
    if (!confirm('Delete ALL unallocated stock for this product?')) return;
    setClearing(true);
    setErr(null);
    try {
      const res = await fetch(`/api/products/id/${id}/stock/unallocated`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Clear failed');
      await load(id);
      alert(`Removed ${json.removed} rows`);
    } catch (e: any) {
      setErr(e?.message || 'Clear failed');
    } finally {
      setClearing(false);
    }
  }

  const help = (dt?: Product['deliveryType']) =>
    dt === 'CODE' ? 'CSV columns: code'
    : dt === 'ACCOUNT' ? 'CSV columns: email,password[,note]'
    : 'CSV columns: text';

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stock — {data?.product?.title || '…'}</h1>
        <Link href="/admin/products" className="underline">Back to Products</Link>
      </div>

      {!id && <div>Loading…</div>}
      {id && (
        <>
          {loading && <div>Loading…</div>}
          {err && <div className="text-sm text-red-600 mb-3">{String(err)}</div>}

          {data && (
            <>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-sm text-neutral-500">Total</div>
                  <div className="text-2xl font-semibold">{data.total}</div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-sm text-neutral-500">Allocated</div>
                  <div className="text-2xl font-semibold">{data.allocated}</div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-sm text-neutral-500">Unallocated</div>
                  <div className="text-2xl font-semibold">{data.unallocated}</div>
                </div>
              </div>

              <form onSubmit={onUpload} className="rounded-xl border bg-white p-4 mb-4 space-y-3">
                <div className="text-sm text-neutral-600">
                  <b>Upload CSV</b> — {help(data.product.deliveryType)}
                </div>
                <input ref={fileRef} type="file" accept=".csv" />
                <div className="flex gap-2">
                  <button className="rounded bg-neutral-900 text-white px-4 py-2 disabled:opacity-60" disabled={uploading}>
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                  <button type="button" onClick={clearUnallocated} className="rounded border px-4 py-2 disabled:opacity-60" disabled={clearing} title="Remove all unallocated stock">
                    {clearing ? 'Clearing…' : 'Clear unallocated'}
                  </button>
                </div>
                <div className="text-xs text-neutral-500">Tip: Use plain CSV with commas. Headers required. Max preview shown: 50 rows.</div>
              </form>

              <div className="rounded-xl border bg-white p-4">
                <div className="font-medium mb-2">Unallocated preview (first 50)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-neutral-50">
                      <tr>
                        <th className="text-left p-2">ID</th>
                        {data.product.deliveryType === 'CODE' && <th className="text-left p-2">code</th>}
                        {data.product.deliveryType === 'ACCOUNT' && (<><th className="text-left p-2">email</th><th className="text-left p-2">password</th><th className="text-left p-2">note</th></>)}
                        {data.product.deliveryType === 'TEXT' && <th className="text-left p-2">text</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.preview.length === 0 && (<tr><td className="p-2 text-neutral-500" colSpan={5}>No unallocated rows.</td></tr>)}
                      {data.preview.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="p-2">{r.id}</td>
                          {data.product.deliveryType === 'CODE' && <td className="p-2">{r.code}</td>}
                          {data.product.deliveryType === 'ACCOUNT' && (<><td className="p-2">{r.email}</td><td className="p-2">{r.password}</td><td className="p-2">{r.note}</td></>)}
                          {data.product.deliveryType === 'TEXT' && <td className="p-2 whitespace-pre">{r.text}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
