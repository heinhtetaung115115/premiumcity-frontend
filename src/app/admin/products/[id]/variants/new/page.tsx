'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) },
  });
  const t = await res.text(); let j=null; try{ j=t?JSON.parse(t):null }catch{}
  if (!res.ok) throw new Error(j?.error || t || 'Request failed');
  return j;
}

export default function AdminNewVariant() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState({ title: '', months: '', price: '', active: true });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    if (!form.title || !form.price) { setErr('Please fill title and price.'); return; }
    setSaving(true);
    try {
      await api(`/api/products/id/${id}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          months: form.months ? Number(form.months) : undefined,
          price: Number(form.price),
          active: form.active,
        }),
      });
      router.push(`/admin/products/${id}/variants`);
    } catch (e: any) { setErr(e?.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Add variant</h1>
      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 space-y-3">
        <div>
          <label className="block text-sm mb-1">Title (e.g., 1 month, 6 months)</label>
          <input className="w-full rounded border px-3 py-2"
                 value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Months (optional)</label>
            <input className="w-full rounded border px-3 py-2" type="number" min="1"
                   value={form.months} onChange={(e)=>setForm({...form,months:e.target.value})}/>
          </div>
          <div>
            <label className="block text-sm mb-1">Price (MMK)</label>
            <input className="w-full rounded border px-3 py-2" type="number" min="0"
                   value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})}/>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={form.active}
                 onChange={(e)=>setForm({...form,active:e.target.checked})}/>
          <label htmlFor="active" className="text-sm">Active</label>
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex gap-2">
          <button className="rounded bg-neutral-900 text-white px-4 py-2 disabled:opacity-60" disabled={saving}>
            {saving ? 'Saving…' : 'Create'}
          </button>
          <button type="button" onClick={()=>history.back()} className="rounded border px-4 py-2">Cancel</button>
        </div>
      </form>
    </div>
  );
}
