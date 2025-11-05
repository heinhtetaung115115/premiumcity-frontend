import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

function getId(req: Request, ctx?: { params?: { id?: string } }) {
  if (ctx?.params?.id) return ctx.params.id;
  try {
    const u = new URL(req.url);
    const parts = u.pathname.split('/').filter(Boolean); // ["api","products","id","<id>","stock","bulk"]
    const i = parts.findIndex(p => p === 'id');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {}
  return undefined;
}

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const nonEmpty = lines.filter(l => l.length > 0);
  if (!nonEmpty.length) return { header: [] as string[], rows: [] as string[][] };
  const header = nonEmpty[0].split(',').map(h => h.trim().toLowerCase());
  const rows = nonEmpty.slice(1).map(l => l.split(',').map(c => c.trim()));
  return { header, rows };
}

export async function POST(req: Request, ctx: { params?: { id?: string } }) {
  try {
    const id = getId(req, ctx);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file missing' }, { status: 400 });

    const text = await file.text();
    const { header, rows } = parseCSV(text);
    if (!header.length || !rows.length) {
      return NextResponse.json({ error: 'CSV empty' }, { status: 400 });
    }

    const data: any[] = [];
    if (product.deliveryType === 'CODE') {
      const ci = header.indexOf('code');
      if (ci < 0) return NextResponse.json({ error: 'CSV needs column: code' }, { status: 400 });
      for (const r of rows) {
        const code = r[ci];
        if (code) data.push({ productId: id, code });
      }
    } else if (product.deliveryType === 'ACCOUNT') {
      const ei = header.indexOf('email');
      const pi = header.indexOf('password');
      const ni = header.indexOf('note');
      if (ei < 0 || pi < 0) {
        return NextResponse.json({ error: 'CSV needs columns: email,password[,note]' }, { status: 400 });
      }
      for (const r of rows) {
        const email = r[ei];
        const password = r[pi];
        const note = ni >= 0 ? r[ni] : undefined;
        if (email && password) data.push({ productId: id, email, password, note });
      }
    } else {
      const ti = header.indexOf('text');
      if (ti < 0) return NextResponse.json({ error: 'CSV needs column: text' }, { status: 400 });
      for (const r of rows) {
        const t = r[ti];
        if (t) data.push({ productId: id, text: t });
      }
    }

    if (!data.length) return NextResponse.json({ error: 'No valid rows' }, { status: 400 });

    const result = await prisma.stockItem.createMany({ data });

    return NextResponse.json({ ok: true, inserted: result.count });
  } catch (e: any) {
    console.error('POST /api/products/id/[id]/stock/bulk error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
