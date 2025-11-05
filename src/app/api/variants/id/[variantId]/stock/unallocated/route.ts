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

export async function DELETE(
  req: Request,
  ctx: { params: { variantId?: string } }
) {
  try {
    const variantId = extractVariantId(req, ctx.params);
    if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });

    const result = await prisma.stockItem.deleteMany({
      where: { variantId, allocated: false },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
