import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function getId(req: Request, ctx?: { params?: { id?: string } }) {
  if (ctx?.params?.id) return ctx.params.id;
  try {
    const u = new URL(req.url);
    const parts = u.pathname.split('/').filter(Boolean); // .../admin/products/id/<id>/purge
    const i = parts.findIndex(p => p === 'id');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

/**
 * PERMANENTLY remove a product + ALL its variants and stock.
 * IMPORTANT: Orders and OrderItems are preserved (customers keep seeing their orders).
 *
 * NOTE: In real production you must secure this (auth/z). For now we're relying on UI "RequireAdmin".
 */
export async function DELETE(req: Request, ctx: { params?: { id?: string } }) {
  try {
    const id = getId(req, ctx);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ ok: true, purged: false, reason: 'not-found' });

    await prisma.$transaction(async (tx) => {
      // delete ALL stock for this product (both allocated and unallocated)
      await tx.stockItem.deleteMany({ where: { productId: id } });
      // delete ALL variants
      await tx.productVariant.deleteMany({ where: { productId: id } });
      // delete the product itself
      await tx.product.delete({ where: { id } });
    });

    // Orders & OrderItems remain intact on purpose
    return NextResponse.json({ ok: true, purged: true });
  } catch (e: any) {
    console.error('DELETE /api/admin/products/id/[id]/purge error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
