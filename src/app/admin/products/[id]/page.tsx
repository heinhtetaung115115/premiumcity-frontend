'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RequireAdmin from '@/components/RequireAdmin';
import { api } from '@/lib/api';

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  deliveryType: 'CODE' | 'ACCOUNT' | 'TEXT';
  description?: string;
  active: boolean;
};

export default function AdminEditProduct() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api(`/admin/products/${id}`, { method: 'GET' });
        setForm(data);
      } catch {
        // fallback mock if backend not ready
        setForm({
          id: String(id),
          title: 'Sample product',
          slug: 'sample',
          price: 1000,
          deliveryType: 'CODE',
          description: '',
          active: true,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErr(null);
    setSaving(true);
    try {
      await api(`/admin/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          price: Number(form.price),
          deliveryType: form.deliveryType,
          description: form.description || undefined,
          active: !!form.active,
        }),
      });
      router.push('/admin/products');
    } catch (e: any) {
      setErr(e?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <div className="p-6">Loading…</div>;

  return (
    <RequireAdmin>
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Edit product</h1>
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-4">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Slug</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Price (MMK)</label>
              <input
                className="w-full rounded border px-3 py-2"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Delivery Type</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={form.deliveryType}
                onChange={(e) => setForm({ ...form, deliveryType: e.target.value as any })}
              >
                <option value="CODE">CODE</option>
                <option value="ACCOUNT">ACCOUNT</option>
                <option value="TEXT">TEXT</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={4}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <label htmlFor="active" className="text-sm">Active</label>
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}
          <button className="rounded bg-neutral-900 text-white px-4 py-2" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </RequireAdmin>
  );
}
