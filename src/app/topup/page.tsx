'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { api } from '@/lib/api';
import { addDevBalance } from '@/lib/wallet';

function TopupClient() {
  const [form, setForm] = useState({ amount: '', method: 'KBZ', reference: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function asNumber(s: string) {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPreviewUrl(null);

    const amountNum = asNumber(form.amount);
    if (amountNum <= 0) {
      setErr('Enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api('/api/wallet/topups', {
        method: 'POST',
        body: JSON.stringify({
          amount: amountNum,
          method: form.method,
          reference: form.reference || undefined,
        }),
      });

      setPreviewUrl(res?.mail?.previewUrl || null);

      // DEV convenience: credit local wallet immediately so you can keep testing.
      await addDevBalance(amountNum);

      alert('Top-up submitted. We will review shortly.');
    } catch (e: any) {
      setErr(e?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => { setPreviewUrl(null); }, [form.amount, form.method, form.reference]);

  return (
    <RequireAuth>
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-2">Top up wallet</h1>

        <div className="rounded-xl border bg-white p-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Amount (MMK)</label>
              <input
                className="w-full rounded border px-3 py-2"
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Method</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                <option value="KBZ">KBZ</option>
                <option value="Wave">Wave</option>
                <option value="AYA">AYA</option>
                <option value="CB">CB</option>
                <option value="Bank">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Reference (optional)</label>
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Last 6 digits / note"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </div>

            {err && <div className="text-sm text-red-600">{err}</div>}

            <button
              className="rounded bg-neutral-900 text-white px-4 py-2 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit top-up'}
            </button>

            {previewUrl && (
              <div className="mt-3 rounded-lg border bg-neutral-50 p-3 text-sm">
                Email sent (dev preview).{' '}
                <a href={previewUrl} target="_blank" className="underline">
                  Open preview
                </a>
              </div>
            )}
          </form>
        </div>

        <div className="mt-4 rounded-xl border bg-white p-4 text-sm text-neutral-700">
          <div className="font-medium mb-1">How it works</div>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Choose amount and method, submit your top-up.</li>
            <li>We review it manually and approve.</li>
            <li>Your wallet balance updates; you can buy instantly.</li>
          </ol>
        </div>
      </div>
    </RequireAuth>
  );
}

export default dynamic(() => Promise.resolve(TopupClient), { ssr: false });
