'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WalletBadge from '@/components/WalletBadge';
import ClientOnly from '@/components/ClientOnly';
import AuthSync from '@/components/AuthSync';
import { api } from '@/lib/api';

type LocalUser = { id: string; email?: string; role?: string } | null;

function getLocalUser(): LocalUser {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [user, setUser] = useState<LocalUser>(null);
  const [serverRole, setServerRole] = useState<string | null>(null);

  // Keep local user state from localStorage
  useEffect(() => {
    const read = () => setUser(getLocalUser());
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  // Ask server who we are (authoritative role)
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const me = await api('/api/wallet'); // attaches x-user-id; server may also read cookie
        if (!stop) setServerRole(me?.role || null);
      } catch {
        if (!stop) setServerRole(null);
      }
    })();
    return () => { stop = true; };
  }, [user?.id]); // refetch when local user changes

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setServerRole(null);
    window.dispatchEvent(new Event('storage'));
  }

  const showAdminLink = serverRole === 'ADMIN';

  return (
    <ClientOnly>
      {/* Sync localStorage → cookies so server routes can see uid */}
      <AuthSync />
      <header className="border-b bg-white">
        <div className="container mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="font-semibold">Premium City MM</Link>
          <nav className="ml-auto flex items-center gap-4">
            <Link href="/">Home</Link>
            <Link href="/topup">Top up</Link>
            <Link href="/orders">Orders</Link>
            {showAdminLink && <Link href="/admin">Admin</Link>}
            {user && <WalletBadge />}
            {user ? (
              <button onClick={logout} className="rounded bg-neutral-900 px-3 py-1 text-white">Logout</button>
            ) : (
              <>
                <Link href="/login">Login</Link>
                <Link href="/register" className="rounded bg-neutral-900 px-3 py-1 text-white">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </ClientOnly>
  );
}
