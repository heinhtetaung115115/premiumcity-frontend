'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

function RegisterClient() {
  const router = useRouter();

  // ✅ Hooks in a fixed, unconditional order
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push('/login');
    } catch (e: any) {
      setErr(e?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-4">
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Email (or phone)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          autoComplete="email"
        />
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="new-password"
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="rounded bg-neutral-900 text-white px-4 py-2" disabled={loading}>
          {loading ? 'Creating…' : 'Sign up'}
        </button>
      </form>
    </div>
  );
}

// 👉 Export as client-only to avoid SSR hydration differences (autofill/extension styles)
export default dynamic(() => Promise.resolve(RegisterClient), { ssr: false });
