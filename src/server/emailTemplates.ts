export function topupAdminAlert({
  amountMMK,
  method,
  reference,
  adminUrl,
}: {
  amountMMK: string;
  method: string;
  reference?: string;
  adminUrl: string;
}) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif">
    <h3 style="margin:0 0 8px">New top-up request</h3>
    <p style="margin:0 0 4px"><b>Amount:</b> ${amountMMK} MMK</p>
    <p style="margin:0 0 4px"><b>Method:</b> ${method}</p>
    <p style="margin:0 0 12px"><b>Reference:</b> ${reference || '-'}</p>
    <a href="${adminUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:8px 12px;border-radius:8px">Open Admin</a>
  </div>`;
}

export function topupApprovedCustomer({
  name,
  amountMMK,
  method,
  reference,
  ordersUrl,
}: {
  name?: string;
  amountMMK: string;
  method: string;
  reference?: string;
  ordersUrl: string;
}) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif">
    <h3 style="margin:0 0 8px">Top-up Approved ✅</h3>
    <p style="margin:0 12px 12px 0">Hi ${name || 'Customer'}, your top-up has been approved.</p>
    <p style="margin:0 0 4px"><b>Amount:</b> ${amountMMK} MMK</p>
    <p style="margin:0 0 4px"><b>Method:</b> ${method}</p>
    <p style="margin:0 12px 12px 0"><b>Reference:</b> ${reference || '-'}</p>
    <a href="${ordersUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:8px 12px;border-radius:8px">View my orders</a>
  </div>`;
}
