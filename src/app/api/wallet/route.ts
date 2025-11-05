// src/app/api/wallet/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';

function getUserIdFrom(req: Request): string | null {
  const h = req.headers.get('x-user-id');
  if (h) return h;
  try {
    const c = cookies();
    const uid = c.get('uid')?.value;
    return uid || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const userId = getUserIdFrom(req);
    if (!userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, walletBalance: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
