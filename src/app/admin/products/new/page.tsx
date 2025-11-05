'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    const errMsg = json?.error || text || 'Request failed';
    const err: any = new Error(errMsg);
    err.status = res.status;
    err.code = json?.code;
    throw err;
  }
  return json;
}

function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminNewProduct() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    price: '',
    deliveryType: 'CODE',
    active: true,
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!form.title || !form.slug || !form.price) {
      setErr('Please fill title, slug, and price.');
      return;
    }
    if (!['CODE', 'ACCOUNT', 'TEXT'].includes(form.deliveryType)) {
      setErr('Invalid delivery type.');
      return;
    }

    setSaving(true);
    try {
      await api('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim(),
          price: Number(form.price),
          deliveryType: form.deliveryType,
          active: form.active,
          description: form.description || undefined,
        }),
      });
      router.push('/admin/products');
    } catch (e: any) {
      if (e?.status === 409 && e?.code === 'SLUG_TAKEN') {
        setErr('This slug already exists. Try a different one.');
      } else {
        setErr(e?.message || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Add product</h1>

      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 space-y-3">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, slug: f.slug || toSlug(title) }));
            }}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: toSlug(e.target.value) })}
          />
          <div className="text-xs text-neutral-500 mt-1">Must be unique — e.g. <code>netflix-premium</code></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Price (MMK)</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Delivery type</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={form.deliveryType}
              onChange={(e) => setForm({ ...form, deliveryType: e.target.value as any })}
            >
              <option value="CODE">CODE (key/code)</option>
              <option value="ACCOUNT">ACCOUNT (email+password)</option>
              <option value="TEXT">TEXT (activation message)</option>
            </select>
          </div>
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

        <div>
          <label className="block text-sm mb-1">Description (optional)</label>
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex gap-2">
          <button
            className="rounded bg-neutral-900 text-white px-4 py-2 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => history.back()}
            className="rounded border px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
