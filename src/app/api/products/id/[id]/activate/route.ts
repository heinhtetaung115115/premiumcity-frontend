// src/app/api/products/id/[id]/activate/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function getId(req: Request, ctx?: { params?: { id?: string } }) {
  if (ctx?.params?.id) return ctx.params.id;
  try {
    const u = new URL(req.url);
    const parts = u.pathname.split('/').filter(Boolean); // .../products/id/<id>/activate
    const i = parts.findIndex(p => p === 'id');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

// POST /api/products/id/[id]/activate
// Sets active = true
export async function POST(req: Request, ctx: { params?: { id?: string } }) {
  try {
    const id = getId(req, ctx);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const prod = await prisma.product.update({
      where: { id },
      data: { active: true },
      select: { id: true, active: true },
    });

    return NextResponse.json(prod);
  } catch (e: any) {
    console.error('POST /api/products/id/[id]/activate error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
