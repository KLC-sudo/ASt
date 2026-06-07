export interface WhatsAppLinkParams {
  phone: string;
  orderReference: string;
  eventTitle: string;
  amountUGX: number;
  quantity: number;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('256')) return digits;
  if (digits.startsWith('0')) return `256${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppLink(p: WhatsAppLinkParams): string {
  const phone = normalizePhone(p.phone);
  const message = [
    `Hello, I have paid for my Album Studies ticket.`,
    ``,
    `Event: ${p.eventTitle}`,
    `Order ref: ${p.orderReference}`,
    `Quantity: ${p.quantity}`,
    `Amount: UGX ${p.amountUGX.toLocaleString('en-UG')}`,
    ``,
    `Please confirm receipt. Thank you.`,
  ].join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
