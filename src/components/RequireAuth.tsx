'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type User = Record<string, any> | null;

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('user');
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, []);

  if (!mounted) return null; // 👈 avoid SSR/CSR mismatch

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-6">
        <div className="rounded-xl border bg-white p-6">
          <p className="mb-3">Please login to continue.</p>
          <Link href="/login" className="rounded bg-neutral-900 text-white px-3 py-2">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
