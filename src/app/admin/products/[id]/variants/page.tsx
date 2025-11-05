'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Variant = { id: string; title: string; months?: number | null; price: number; active: boolean; };

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  const t = await res.text(); let j = null; try { j = t? JSON.parse(t) : null; } catch {}
  if (!res.ok) throw new Error(j?.error || t || 'Request failed');
  return j;
}

export default function AdminVariantsPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true); setErr(null);
    try {
      const data = await api(`/api/products/id/${id}/variants`);
      setItems(data.items || []);
    } catch (e: any) { setErr(e?.message || 'Load failed'); }
    finally { setLoading(false); }
  }

  async function remove(variantId: string) {
    if (!confirm('Delete this variant? (unallocated stock will be removed)')) return;
    try {
      const res = await fetch(`/api/variants/id/${variantId}`, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Delete failed');
      await load();
    } catch (e: any) { alert(e?.message || 'Delete failed'); }
  }

  useEffect(() => { load(); }, [id]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Variants</h1>
        <div className="space-x-3">
          <Link href={`/admin/products`} className="underline">Back to products</Link>
          <Link href={`/admin/products/${id}/variants/new`} className="rounded bg-neutral-900 text-white px-3 py-2">Add variant</Link>
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-neutral-50">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Months</th>
              <th className="text-right p-3">Price (MMK)</th>
              <th className="text-center p-3">Active</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(v => (
              <tr key={v.id} className="border-b last:border-0">
                <td className="p-3">{v.title}</td>
                <td className="p-3">{v.months ?? '–'}</td>
                <td className="p-3 text-right">{new Intl.NumberFormat('en-MM').format(v.price)}</td>
                <td className="p-3 text-center">{v.active ? 'Yes' : 'No'}</td>
                <td className="p-3 text-right space-x-3 whitespace-nowrap">
                  <Link href={`/admin/variants/${v.id}/stock`} className="underline">Stock</Link>
                  <button onClick={() => remove(v.id)} className="text-red-600 underline">Delete</button>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr><td className="p-3" colSpan={5}>No variants.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
