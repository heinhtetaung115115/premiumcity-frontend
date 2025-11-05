'use client';

import { useEffect } from 'react';

function setCookie(name: string, value: string, days = 30) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export default function AuthSync() {
  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem('user');
        if (!raw) {
          deleteCookie('uid');
          deleteCookie('uemail');
          deleteCookie('urole');
          return;
        }
        const u = JSON.parse(raw || '{}');
        if (u?.id) {
          setCookie('uid', u.id);
          if (u.email) setCookie('uemail', u.email);
          if (u.role) setCookie('urole', u.role);
        } else {
          deleteCookie('uid');
          deleteCookie('uemail');
          deleteCookie('urole');
        }
      } catch {
        deleteCookie('uid');
        deleteCookie('uemail');
        deleteCookie('urole');
      }
    };

    // initial + react to external changes
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('wallet:refresh', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('wallet:refresh', sync);
    };
  }, []);

  return null;
}
