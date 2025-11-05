import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { cookies } from 'next/headers';

function getUserFromRequest(req: Request) {
  // Dev helper: allow header override (used by our api() during dev)
  const id = req.headers.get('x-user-id');
  const role = req.headers.get('x-user-role');
  if (id && role) return { id, role };

  // Cookie fallback (if you set cookie-based auth later)
  try {
    const c = cookies();
    const uid = c.get('uid')?.value || null;
    const urole = c.get('role')?.value || null;
    if (uid && urole) return { id: uid, role: urole };
  } catch {}

  // No auth info
  return { id: null, role: null };
}

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);

    // Require admin; return a friendly, consistent shape on forbidden
    if (!user.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', items: [] },
        { status: 403 }
      );
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        deliveryType: true,
        active: true,
      },
    });

    // Always return items array (never null)
    return NextResponse.json({ items: products });
  } catch (e: any) {
    // Still keep the shape so the UI never crashes
    return NextResponse.json(
      { error: e?.message || 'Server error', items: [] },
      { status: 500 }
    );
  }
}
