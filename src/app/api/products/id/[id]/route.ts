import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function getId(req: Request, ctx?: { params?: { id?: string } }) {
  if (ctx?.params?.id) return ctx.params.id;
  try {
    const u = new URL(req.url);
    const parts = u.pathname.split('/').filter(Boolean); // .../products/id/<id>
    const i = parts.findIndex(p => p === 'id');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

export async function DELETE(req: Request, ctx: { params?: { id?: string } }) {
  try {
    const id = getId(req, ctx);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const allocatedCount = await prisma.stockItem.count({
      where: { productId: id, allocated: true },
    });
    const ordersCount = await prisma.order.count({ where: { productId: id } });

    if (allocatedCount > 0 || ordersCount > 0) {
      await prisma.product.update({ where: { id }, data: { active: false } });
      return NextResponse.json({ ok: true, deactivated: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.stockItem.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true, deleted: true });
  } catch (e: any) {
    console.error('DELETE /api/products/id/[id] error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
