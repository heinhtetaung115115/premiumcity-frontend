import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function extractVariantId(req: Request, params?: { variantId?: string }) {
  if (params?.variantId) return params.variantId;
  try {
    const m = new URL(req.url).pathname.match(/\/api\/variants\/id\/([^/]+)/);
    return m?.[1] || null;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  ctx: { params: { variantId?: string } }
) {
  try {
    const id = extractVariantId(req, ctx.params);
    if (!id) {
      return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, title: true, slug: true, deliveryType: true, active: true },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const unallocated = await prisma.stockItem.count({
      where: { productId: variant.productId, variantId: variant.id, allocated: false },
    });

    return NextResponse.json({
      variant: {
        id: variant.id,
        title: variant.title,
        price: variant.price,
        active: variant.active,
        months: variant.months,
        productId: variant.productId,
      },
      product: variant.product ?? null,
      stock: { unallocated },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
