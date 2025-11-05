import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function extractSlug(req: Request, params?: { slug?: string }) {
  if (params?.slug) return params.slug;
  try {
    const m = new URL(req.url).pathname.match(/\/api\/products\/([^/]+)$/);
    return m?.[1] || null;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  ctx: { params: { slug?: string } }
) {
  try {
    const slug = extractSlug(req, ctx.params);
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          where: { active: true },
          orderBy: { price: 'asc' },
          select: { id: true, title: true, price: true, months: true, active: true },
        },
      },
    });

    if (!product || !product.active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const counts = await prisma.stockItem.groupBy({
      by: ['variantId'],
      where: { productId: product.id, allocated: false },
      _count: { variantId: true },
    });
    const countMap = new Map(counts.map(c => [c.variantId, c._count.variantId]));

    return NextResponse.json({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description || '',
      deliveryType: product.deliveryType, // 'CODE' | 'ACCOUNT' | 'TEXT'
      variants: product.variants.map(v => ({
        id: v.id,
        title: v.title,
        price: v.price,
        months: v.months,
        unallocated: countMap.get(v.id) || 0,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
