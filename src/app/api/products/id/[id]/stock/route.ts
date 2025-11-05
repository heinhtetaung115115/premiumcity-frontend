import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function getId(req: Request, ctx?: { params?: { id?: string } }) {
  if (ctx?.params?.id) return ctx.params.id;
  try {
    const u = new URL(req.url);
    const parts = u.pathname.split('/').filter(Boolean); // e.g. ["api","products","id","<id>","stock"]
    const i = parts.findIndex(p => p === 'id');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

export async function GET(req: Request, ctx: { params?: { id?: string } }) {
  try {
    const id = getId(req, ctx);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const total = await prisma.stockItem.count({ where: { productId: id } });
    const unallocated = await prisma.stockItem.count({ where: { productId: id, allocated: false } });
    const allocated = total - unallocated;

    const preview = await prisma.stockItem.findMany({
      where: { productId: id, allocated: false },
      take: 50,
      orderBy: { id: 'desc' },
      select: { id: true, code: true, email: true, password: true, note: true, text: true },
    });

    return NextResponse.json({ product, total, allocated, unallocated, preview });
  } catch (e: any) {
    console.error('GET /api/products/id/[id]/stock error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
