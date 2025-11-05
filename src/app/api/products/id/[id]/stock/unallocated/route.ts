import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function getId(req: Request, ctx?: { params?: { id?: string } }) {
  if (ctx?.params?.id) return ctx.params.id;
  try {
    const u = new URL(req.url);
    const parts = u.pathname.split('/').filter(Boolean); // ["api","products","id","<id>","stock","unallocated"]
    const i = parts.findIndex(p => p === 'id');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

export async function DELETE(req: Request, ctx: { params?: { id?: string } }) {
  try {
    const id = getId(req, ctx);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const removed = await prisma.stockItem.deleteMany({
      where: { productId: id, allocated: false },
    });

    return NextResponse.json({ ok: true, removed: removed.count });
  } catch (e: any) {
    console.error('DELETE /api/products/id/[id]/stock/unallocated error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
