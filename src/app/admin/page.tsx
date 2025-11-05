'use client';

import Link from 'next/link';
import RequireAdmin from '@/components/RequireAdmin';

export default function AdminHome() {
  return (
    <RequireAdmin>
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Admin</h1>
        <div className="grid gap-4">
          <Link href="/admin/products" className="rounded-xl border bg-white p-6">Manage products</Link>
        </div>
      </div>
    </RequireAdmin>
  );
}
