import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';

function getUserIdFrom(req: Request): string | null {
  const h = req.headers.get('x-user-id');
  if (h) return h;
  try {
    const c = cookies();
    return c.get('uid')?.value || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const userId = getUserIdFrom(req);
    if (!userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return NextResponse.json({
      items: orders.map(o => ({
        id: o.id,
        productTitle: o.productTitle,
        deliveryType: o.deliveryType,
        createdAt: o.createdAt,
        items: o.items.map(it => ({
          code: it.code,
          email: it.email,
          password: it.password,
          note: it.note,
          text: it.text,
        })),
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
