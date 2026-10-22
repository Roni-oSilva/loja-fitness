"use server";
import { headers } from "next/headers";
import { cartSchema, checkoutSchema } from "@/lib/validations/checkout";
import { buildQuote, createOrder, type Quote } from "@/lib/services/orders";
import { rateLimit } from "@/lib/rate-limit";
import { publicEnv } from "@/lib/supabase/env";

export type QuoteResponse = { ok: true; quote: Quote } | { ok: false; message: string };

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export async function quoteCartAction(input: unknown): Promise<QuoteResponse> {
  const parsed = cartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Carrinho inválido." };
  if (!publicEnv().configured) return { ok: false, message: "A loja ainda não está configurada." };
  if (!rateLimit(`quote:${await clientIp()}`, 60, 60_000).ok) return { ok: false, message: "Muitas atualizações. Aguarde um instante." };
  try {
    return { ok: true, quote: await buildQuote(parsed.data.items, parsed.data.couponCode) };
  } catch (e) {
    console.error("[cart] quote", (e as Error).message);
    return { ok: false, message: "Não foi possível atualizar o carrinho. Verifique sua conexão e tente novamente." };
  }
}

export type CheckoutResponse =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; quote?: Quote };

export async function checkoutAction(input: unknown): Promise<CheckoutResponse> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, message: "Confira os dados informados.", fieldErrors };
  }
  if (!publicEnv().configured) return { ok: false, message: "A loja ainda não está configurada." };
  const ip = await clientIp();
  if (!rateLimit(`order:${ip}`, 5, 10 * 60_000).ok) return { ok: false, message: "Muitos pedidos em pouco tempo. Aguarde alguns minutos e tente novamente." };
  try {
    const d = parsed.data;
    const r = await createOrder({ idempotencyKey: d.idempotencyKey, name: d.name, phone: d.phone || undefined, email: d.email, notes: d.notes, items: d.items, couponCode: d.couponCode, expectedTotalCents: (input as { expectedTotalCents?: number }).expectedTotalCents });
    if (!r.ok) return { ok: false, message: r.message, quote: r.quote };
    return { ok: true, redirectTo: `/pedido/${r.orderId}?t=${encodeURIComponent(r.token)}&abrir=1` };
  } catch (e) {
    console.error("[checkout]", (e as Error).message);
    return { ok: false, message: "Não foi possível registrar o pedido agora. Nada foi enviado; tente novamente." };
  }
}
