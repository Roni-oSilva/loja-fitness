import { formatBRL } from "./money";

export interface WhatsAppOrder {
  storeName: string; orderNumber: string;
  items: { name: string; size?: string | null; color?: string | null; quantity: number; unitPriceCents: number }[];
  subtotalCents: number; discountCents: number; shippingCents: number | null; totalCents: number;
  customerName?: string | null; couponCode?: string | null; notes?: string | null;
}

/** Só inclui o que foi informado/calculado; nunca afirma pagamento. */
export function buildOrderMessage(o: WhatsAppOrder): string {
  const lines = o.items.map((i) => {
    const opts = [i.size && `Tam ${i.size}`, i.color].filter(Boolean).join(", ");
    return `• ${i.quantity}x ${i.name}${opts ? ` (${opts})` : ""} — ${formatBRL(i.unitPriceCents * i.quantity)}`;
  });
  const out = [
    `Olá! Gostaria de finalizar meu pedido na ${o.storeName}.`,
    `Pedido: ${o.orderNumber}`,
    "Produtos:", ...lines,
    `Subtotal: ${formatBRL(o.subtotalCents)}`,
  ];
  if (o.discountCents > 0) out.push(`Descontos: ${formatBRL(o.discountCents)}${o.couponCode ? ` (cupom ${o.couponCode})` : ""}`);
  out.push(`Frete: ${o.shippingCents == null ? "a confirmar" : o.shippingCents === 0 ? "grátis" : formatBRL(o.shippingCents)}`);
  out.push(`Total estimado: ${formatBRL(o.totalCents)}${o.shippingCents == null ? " (sem frete)" : ""}`);
  if (o.customerName) out.push(`Nome: ${o.customerName}`);
  if (o.notes) out.push(`Observações: ${o.notes}`);
  out.push("Gostaria de confirmar a disponibilidade, o frete e as condições de pagamento.");
  return out.join("\n");
}

/** Número internacional somente com dígitos (ex.: 5511999998888). */
export function normalizeWhatsAppNumber(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}

export function buildWhatsAppLink(number: string, message?: string): string {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
