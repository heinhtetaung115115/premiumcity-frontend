'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAdmin from '@/components/RequireAdmin';
import { api } from '@/lib/api';

type Product = {
  id: string;
  title: string;
  slug: string;
  deliveryType: 'CODE' | 'ACCOUNT' | 'TEXT';
  active: boolean;
};

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  function toArray(data: any): Product[] {
    // Normalize ANY response into an array safely
    if (Array.isArray(data)) return data as Product[];
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return data.items as Product[];
    }
    return [];
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await api('/admin/products', { method: 'GET' });
      setItems(toArray(data));
    } catch (e: any) {
      // api() throws on non-2xx; we still keep UI alive
      setErr(e?.message || 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this product?')) return;
    try {
      await api(`/admin/products/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      alert(e?.message || 'Delete failed');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <RequireAdmin>
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Products</h1>
          <Link href="/admin/products/new" className="rounded bg-neutral-900 text-white px-3 py-2">
            Add product
          </Link>
        </div>

        {loading && <div>Loading…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-neutral-50">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Slug</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-center">Active</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">{p.title}</td>
                  <td className="p-3">{p.slug}</td>
                  <td className="p-3">{p.deliveryType}</td>
                  <td className="p-3 text-center">{p.active ? 'Yes' : 'No'}</td>
                  <td className="p-3 text-right space-x-2">
                    <Link href={`/admin/products/${p.id}`} className="underline">Edit</Link>
                    <Link href={`/admin/products/${p.id}/variants`} className="underline">Variants</Link>
                    <Link href={`/product/${p.slug}`} className="underline">View</Link>
                    <button onClick={() => remove(p.id)} className="text-red-600 underline">Delete</button>
                  </td>
                </tr>
              ))}
              {!items.length && !loading && (
                <tr>
                  <td className="p-3" colSpan={5}>No products.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RequireAdmin>
  );
}
