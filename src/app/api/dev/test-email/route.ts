import { NextResponse } from 'next/server';
import { sendMail } from '@/server/mailer';

export async function GET() {
  try {
    const result = await sendMail({
      to: process.env.ADMIN_EMAIL || 'test@example.com',
      subject: 'Test email — Premium City',
      html: '<p>Hello from the raw mailer ✔️</p>',
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Mail error' }, { status: 500 });
  }
}
