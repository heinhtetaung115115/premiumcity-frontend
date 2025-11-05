import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        deliveryType: true,
        variants: {
          where: { active: true },
          select: { id: true, price: true },
        },
      },
    });

    // compute minPrice and total unallocated across variants
    const variantIds = products.flatMap(p => p.variants.map(v => v.id));
    const counts = variantIds.length
      ? await prisma.stockItem.groupBy({
          by: ['variantId'],
          where: { variantId: { in: variantIds }, allocated: false },
          _count: { variantId: true },
        })
      : [];

    const countMap = new Map(counts.map(c => [c.variantId, c._count.variantId]));

    const items = products.map(p => {
      const prices = p.variants.map(v => v.price);
      const minPrice = prices.length ? Math.min(...prices) : null;
      const totalUnallocated = p.variants.reduce((sum, v) => sum + (countMap.get(v.id) || 0), 0);
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description ?? '',
        deliveryType: p.deliveryType,
        minPrice,
        totalUnallocated,
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
