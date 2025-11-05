// src/app/api/checkout/purchase/route.ts
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

export async function POST(req: Request) {
  try {
    const cookieUserId = getUserIdFrom(req);
    const body = await req.json().catch(() => ({}));
    const userId: string | undefined = cookieUserId || body?.userId;
    const variantId: string | undefined = body?.variantId;
    const qty: number = Math.max(1, Number(body?.qty || 1));

    if (!userId || !variantId) {
      return NextResponse.json({ error: 'Missing userId or variantId' }, { status: 400 });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant || !variant.active || !variant.product?.active) {
      return NextResponse.json({ error: 'Product/variant not available' }, { status: 400 });
    }

    const total = variant.price * qty;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const available = await prisma.stockItem.findMany({
      where: { productId: variant.productId, variantId: variant.id, allocated: false },
      select: { id: true, code: true, email: true, password: true, note: true, text: true },
      take: qty,
      orderBy: { id: 'asc' },
    });
    if (available.length < qty) return NextResponse.json({ error: 'Out of stock' }, { status: 409 });

    if (user.walletBalance < total) return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 402 });

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: total } },
        select: { walletBalance: true },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: -total,
          reason: `Purchase: ${variant.product.title}${variant.title ? ' - ' + variant.title : ''}`,
        },
      });

      const chosenIds = available.map(s => s.id);
      await tx.stockItem.updateMany({
        where: { id: { in: chosenIds }, allocated: false },
        data: { allocated: true, allocatedToId: userId, allocatedAt: new Date() },
      });

      const order = await tx.order.create({
        data: {
          userId,
          productId: variant.productId,
          productTitle: `${variant.product.title}${variant.title ? ' - ' + variant.title : ''}`,
          deliveryType: variant.product.deliveryType,
          items: {
            create: available.map(s => ({
              code: s.code || null,
              email: s.email || null,
              password: s.password || null,
              note: s.note || null,
              text: s.text || null,
            })),
          },
        },
        include: { items: true },
      });

      return { orderId: order.id, walletBalance: updatedUser.walletBalance };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('POST /api/checkout/purchase error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
