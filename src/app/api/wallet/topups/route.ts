import { NextResponse } from 'next/server';
import { sendMail } from '@/server/mailer';
import { topupAdminAlert } from '@/server/emailTemplates';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, method, reference } = body || {};
    if (!amount || !method) {
      return NextResponse.json({ error: 'amount and method required' }, { status: 400 });
    }

    // TODO: save to DB here (status = PENDING) when backend is ready

    const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/topups`;
    const html = topupAdminAlert({
      amountMMK: Number(amount).toLocaleString('en-MM'),
      method,
      reference,
      adminUrl,
    });

    const result = await sendMail({
      to: process.env.ADMIN_EMAIL || 'admin@example.com',
      subject: `🔔 New Top-up — ${Number(amount).toLocaleString('en-MM')} MMK`,
      html,
    });

    return NextResponse.json({ ok: true, mail: result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
