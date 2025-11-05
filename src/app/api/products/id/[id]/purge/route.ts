import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function getId(req: Request, ctx?: { params?: { id?: string } }) {
  if (ctx?.params?.id) return ctx.params.id;
  try {
    const u = new URL(req.url);
    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts.findIndex(p => p === 'id');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

/**
 * Permanently remove a product from the catalog while PRESERVING order history.
 * - Requires header: x-purge-secret = process.env.PURGE_SECRET
 * - Deletes: all stock (allocated & unallocated) and all variants, then the product.
 * - Keeps: Orders and OrderItems intact (customers still see their purchases).
 */
export async function DELETE(req: Request, ctx: { params?: { id?: string } }) {
  try {
    // Require secret header
    const secret = req.headers.get('x-purge-secret');
    if (!process.env.PURGE_SECRET || secret !== process.env.PURGE_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const id = getId(req, ctx);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Ensure product exists (optional)
    const prod = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!prod) return NextResponse.json({ ok: true, purged: false, reason: 'not-found' });

    await prisma.$transaction(async (tx) => {
      // Remove ALL stock for this product (including already allocated rows).
      await tx.stockItem.deleteMany({ where: { productId: id } });

      // Remove ALL variants of this product.
      await tx.productVariant.deleteMany({ where: { productId: id } });

      // Finally remove the product itself.
      await tx.product.delete({ where: { id } });
    });

    // IMPORTANT: Do NOT delete orders or order items. They remain visible to users.
    return NextResponse.json({ ok: true, purged: true });
  } catch (e: any) {
    console.error('DELETE /api/products/id/[id]/purge error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
