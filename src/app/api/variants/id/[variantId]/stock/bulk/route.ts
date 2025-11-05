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

function parseCSV(text: string): string[][] {
  // Tiny CSV parser for files
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cur.trim()); cur = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (cur.length || row.length) { row.push(cur.trim()); rows.push(row); row = []; cur = ''; }
      } else cur += ch;
    }
  }
  if (cur.length || row.length) { row.push(cur.trim()); rows.push(row); }
  return rows.filter(r => r.length && r.some(c => c !== ''));
}

function splitLine(line: string): string[] {
  // Detect simple delimiters for pasted lines
  if (line.includes(',')) return line.split(',').map(s => s.trim());
  if (line.includes('\t')) return line.split('\t').map(s => s.trim());
  if (line.includes('|')) return line.split('|').map(s => s.trim());
  if (line.includes(';')) return line.split(';').map(s => s.trim());
  return [line.trim()]; // fallback: single column
}

function parsePasted(text: string): string[][] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.map(splitLine).filter(r => r.length && r.some(c => c !== ''));
}

export async function POST(req: Request, ctx: { params: { variantId?: string } }) {
  try {
    const variantId = extractVariantId(req, ctx.params);
    if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });

    // Load variant + product to know deliveryType & productId
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { id: true, deliveryType: true } } },
    });
    if (!variant || !variant.product) {
      return NextResponse.json({ error: 'Variant or product not found' }, { status: 404 });
    }

    const productId = variant.product.id;
    const deliveryType = variant.product.deliveryType as 'CODE' | 'ACCOUNT' | 'TEXT';

    let rows: string[][] = [];
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // File or pasted text via FormData
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const pasted = (form.get('text') as string | null)?.toString().trim();

      if (file) {
        const t = await file.text();
        rows = parseCSV(t);
      } else if (pasted) {
        rows = parsePasted(pasted);
      } else {
        return NextResponse.json({ error: 'Provide a CSV file or pasted text.' }, { status: 400 });
      }
    } else {
      // JSON body { text: "...." } also supported
      const body = await req.json().catch(() => ({}));
      const pasted = (body?.text || '').toString().trim();
      if (!pasted) return NextResponse.json({ error: 'Missing text' }, { status: 400 });
      rows = parsePasted(pasted);
    }

    if (!rows.length) return NextResponse.json({ error: 'No data rows found' }, { status: 400 });

    // Try to detect and skip header row
    const header = rows[0].map(h => h.toLowerCase());
    let dataRows = rows;
    const looksLikeHeader =
      (deliveryType === 'CODE'    && header.includes('code')) ||
      (deliveryType === 'ACCOUNT' && (header.includes('email') || header.includes('password'))) ||
      (deliveryType === 'TEXT'    && header.includes('text'));
    if (looksLikeHeader) dataRows = rows.slice(1);

    const toCreate: any[] = [];
    for (const cols of dataRows) {
      if (deliveryType === 'CODE') {
        const [code = '', note = ''] = cols;
        if (!code) continue;
        toCreate.push({ productId, variantId, code, note: note || null });
      } else if (deliveryType === 'ACCOUNT') {
        const [email = '', password = '', note = ''] = cols;
        if (!email || !password) continue;
        toCreate.push({ productId, variantId, email, password, note: note || null });
      } else if (deliveryType === 'TEXT') {
        const [textVal = '', note = ''] = cols;
        if (!textVal) continue;
        toCreate.push({ productId, variantId, text: textVal, note: note || null });
      }
    }

    if (!toCreate.length) {
      return NextResponse.json({ error: 'No valid rows to import' }, { status: 400 });
    }

    const result = await prisma.stockItem.createMany({ data: toCreate });
    return NextResponse.json({ count: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
