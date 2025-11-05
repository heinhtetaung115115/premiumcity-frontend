// Simple local mock so you can see orders immediately in dev.
// Later, swap to your real backend and delete this file if you want.

export type DeliveryItem =
  | { type: 'CODE'; code: string }
  | { type: 'ACCOUNT'; email: string; password: string; note?: string }
  | { type: 'TEXT'; text: string };

export type Order = {
  id: string;
  productId: string;
  productTitle: string;
  createdAt: string; // ISO
  items: DeliveryItem[];
};

const KEY = 'mockOrders';

export function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addOrder(o: Order) {
  if (typeof window === 'undefined') return;
  const list = getOrders();
  list.unshift(o);
  localStorage.setItem(KEY, JSON.stringify(list));
}
