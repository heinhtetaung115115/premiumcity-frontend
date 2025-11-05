import { NextResponse } from 'next/server';
import { sendMail } from '@/server/mailer';
import { topupApprovedCustomer } from '@/server/emailTemplates';

// TEMP: replace with your DB integration
async function approveTopupInDb(id: string) {
  // pretend we approved and fetched the record
  return {
    id,
    amount: 20000,
    method: 'KBZ',
    reference: '123456',
    customerEmail: 'customer@example.com',
    customerName: 'Aung',
  };
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const t = await approveTopupInDb(params.id);

    const html = topupApprovedCustomer({
      name: t.customerName,
      amountMMK: t.amount.toLocaleString('en-MM'),
      method: t.method,
      reference: t.reference,
      ordersUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/orders`,
    });

    const result = await sendMail({
      to: t.customerEmail,
      subject: `Top-up approved — ${t.amount.toLocaleString('en-MM')} MMK`,
      html,
    });

    return NextResponse.json({ ok: true, mail: result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
