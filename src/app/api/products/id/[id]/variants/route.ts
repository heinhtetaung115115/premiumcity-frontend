import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function getProductId(req: Request, ctx?: { params?: { id?: string } }) {
  if (ctx?.params?.id) return ctx.params.id;
  try {
    const u = new URL(req.url);
    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts.findIndex(p => p === 'id');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

export async function GET(req: Request, ctx: { params?: { id?: string } }) {
  try {
    const productId = getProductId(req, ctx);
    if (!productId) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });

    const items = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, months: true, price: true, active: true },
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('GET /api/products/id/[id]/variants error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params?: { id?: string } }) {
  try {
    const productId = getProductId(req, ctx);
    if (!productId) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });

    const body = await req.json();
    const { title, months, price, active = true } = body || {};
    if (!title || typeof price === 'undefined') {
      return NextResponse.json({ error: 'Missing title or price' }, { status: 400 });
    }

    // ensure parent exists
    const prod = await prisma.product.findUnique({ where: { id: productId } });
    if (!prod) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const v = await prisma.productVariant.create({
      data: {
        productId,
        title: String(title).trim(),
        months: months ? Number(months) : null,
        price: Number(price),
        active: !!active,
      },
      select: { id: true, title: true, months: true, price: true, active: true },
    });

    return NextResponse.json(v);
  } catch (e: any) {
    console.error('POST /api/products/id/[id]/variants error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
