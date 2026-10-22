import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "../supabase/admin";
import { createPublicClient } from "../supabase/public";
import { applyCoupon, availableStock, COUPON_ERROR_MESSAGES, computeTotals, effectivePriceCents, type PricedLine, type Totals } from "../pricing";
import { buildOrderMessage, buildWhatsAppLink } from "../whatsapp";
import { getStoreSettings } from "./catalog";
import { siteUrl } from "../utils";
import type { CartItemInput } from "../validations/checkout";
import type { Coupon, OrderStatus } from "../types";

export type LineProblem = "unavailable" | "out_of_stock" | "insufficient_stock";
export interface QuoteLine {
  variantId: string; productId: string; slug: string; name: string; size: string | null; color: string | null;
  imageUrl: string | null; unitPriceCents: number; compareAtCents: number | null; quantity: number; stock: number; problem?: LineProblem;
}
export interface Quote {
  lines: QuoteLine[]; totals: Totals; couponCode: string | null; couponId: string | null; couponMessage: string | null;
  hasBlockingProblem: boolean; freeShippingThresholdCents: number | null;
}

/** Recalcula TUDO a partir do banco. Nada do navegador (preço, nome) é usado. */
export async function buildQuote(items: CartItemInput[], couponCode?: string, now = new Date()): Promise<Quote> {
  const db = createPublicClient();
  if (!db) throw new Error("Loja não configurada");
  const settings = await getStoreSettings();
  // mescla linhas duplicadas da mesma variante
  const merged = new Map<string, number>();
  for (const i of items) merged.set(i.variantId, Math.min(99, (merged.get(i.variantId) ?? 0) + i.quantity));
  const ids = [...merged.keys()];
  const { data, error } = await db.from("product_variants")
    .select("*, products(*, product_images(*), categories(slug))").in("id", ids);
  if (error) throw new Error("Falha ao consultar produtos");
  const byId = new Map((data ?? []).map((v: any) => [v.id as string, v]));

  const lines: QuoteLine[] = []; const priced: PricedLine[] = [];
  for (const [variantId, qty] of merged) {
    const v: any = byId.get(variantId);
    const p = v?.products;
    if (!v || !p || p.status !== "published" || !v.is_active) {
      lines.push({ variantId, productId: p?.id ?? "", slug: p?.slug ?? "", name: p?.name ?? "Produto indisponível", size: v?.size ?? null, color: v?.color ?? null, imageUrl: null, unitPriceCents: 0, compareAtCents: null, quantity: qty, stock: 0, problem: "unavailable" });
      continue;
    }
    const unit = effectivePriceCents(p, v, now);
    const img = [...(p.product_images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
    const problem: LineProblem | undefined = v.stock_quantity <= 0 ? "out_of_stock" : qty > v.stock_quantity ? "insufficient_stock" : undefined;
    const compare = v.price_override_cents == null && p.sale_price_cents != null && unit === p.sale_price_cents ? p.base_price_cents : null;
    lines.push({ variantId, productId: p.id, slug: p.slug, name: p.name, size: v.size, color: v.color, imageUrl: img?.image_url ?? null, unitPriceCents: unit, compareAtCents: compare, quantity: qty, stock: v.stock_quantity, problem });
    if (!problem) priced.push({ variantId, productId: p.id, categoryId: p.category_id, unitPriceCents: unit, quantity: qty });
  }

  let discount = 0, couponId: string | null = null, couponMessage: string | null = null, appliedCode: string | null = null;
  if (couponCode) {
    const admin = createAdminClient(); // cupons não são legíveis pelo público
    const { data: c } = await admin.from("coupons").select("*").eq("code", couponCode.toUpperCase()).maybeSingle();
    if (!c) couponMessage = COUPON_ERROR_MESSAGES.inactive;
    else {
      const r = applyCoupon(c as Coupon, priced, now);
      if (r.ok) { discount = r.discountCents; couponId = c.id; appliedCode = c.code; couponMessage = "Cupom aplicado. O desconto será confirmado no atendimento."; }
      else couponMessage = COUPON_ERROR_MESSAGES[r.reason];
    }
  }
  const totals = computeTotals(priced, discount, settings.free_shipping_threshold_cents);
  return { lines, totals, couponCode: appliedCode, couponId, couponMessage, hasBlockingProblem: lines.some((l) => l.problem), freeShippingThresholdCents: settings.free_shipping_threshold_cents };
}

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const newAccessToken = () => randomBytes(24).toString("base64url");

export interface CreateOrderInput {
  idempotencyKey: string; name: string; phone?: string; email?: string; notes?: string;
  items: CartItemInput[]; couponCode?: string; expectedTotalCents?: number;
}
export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: string; token: string; deduplicated: boolean }
  | { ok: false; code: "CART_CHANGED" | "TOTAL_CHANGED" | "UNAVAILABLE" | "FAILED"; message: string; quote?: Quote };

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const quote = await buildQuote(input.items, input.couponCode);
  if (quote.hasBlockingProblem) return { ok: false, code: "CART_CHANGED", message: "Alguns itens ficaram indisponíveis ou sem estoque suficiente. Revise o carrinho.", quote };
  if (input.expectedTotalCents != null && input.expectedTotalCents !== quote.totals.grandTotalCents)
    return { ok: false, code: "TOTAL_CHANGED", message: "Os valores foram atualizados. Confira o novo total antes de continuar.", quote };

  const token = newAccessToken();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_order", { p: {
    idempotency_key: input.idempotencyKey, access_token_hash: hashToken(token),
    customer: { name: input.name, phone: input.phone || null, email: input.email || null },
    customer_notes: input.notes || null, coupon_id: quote.couponId,
    discount_cents: quote.totals.discountCents, shipping_cents: quote.totals.shippingCents,
    items: quote.lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity, unit_price_cents: l.unitPriceCents })),
  } });
  if (error) {
    const m = /(OUT_OF_STOCK|VARIANT_UNAVAILABLE|PRICE_CHANGED|COUPON_INVALID)/.exec(error.message);
    if (m) return { ok: false, code: m[1] === "PRICE_CHANGED" ? "TOTAL_CHANGED" : "UNAVAILABLE", message: "O carrinho mudou enquanto você finalizava. Revise os itens e tente novamente." };
    console.error("[orders] create_order", error.code, error.message.slice(0, 120));
    return { ok: false, code: "FAILED", message: "Não foi possível registrar o pedido agora. Nada foi enviado; tente novamente em instantes." };
  }
  const row = (data as { order_id: string; order_number: string; deduplicated: boolean }[])[0];
  if (!row) return { ok: false, code: "FAILED", message: "Não foi possível registrar o pedido." };
  // Pedido duplicado (mesma chave): o token original não pode ser recuperado — emitimos um novo acesso.
  if (row.deduplicated) {
    await admin.from("orders").update({ access_token_hash: hashToken(token) }).eq("id", row.order_id);
  }
  return { ok: true, orderId: row.order_id, orderNumber: row.order_number, token, deduplicated: row.deduplicated };
}

export interface OrderView {
  id: string; orderNumber: string; status: OrderStatus; createdAt: string; customerName: string | null;
  items: { name: string; size: string | null; color: string | null; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
  subtotalCents: number; discountCents: number; shippingCents: number | null; totalCents: number; couponCode: string | null;
  whatsappLink: string | null; paymentReceivedAt: string | null; storeName: string; logoUrl: string | null;
}

/** Acesso ao pedido exige o token aleatório (comparação em tempo constante). Qualquer falha devolve null (sem distinguir causas). */
export async function getOrderForAccess(id: string, token: string | undefined): Promise<OrderView | null> {
  if (!token || !/^[0-9a-f-]{36}$/i.test(id) || token.length < 20 || token.length > 100) return null;
  let o;
  try {
    const { data } = await createAdminClient().from("orders").select("*, customers(name), order_items(*)").eq("id", id).maybeSingle();
    o = data;
  } catch (e) {
    console.error("[orders] acesso", (e as Error).message.slice(0, 80));
    return null; // sem backend/erro: tratado como "não encontrado", sem detalhes
  }
  if (!o) return null;
  const a = Buffer.from(hashToken(token)), b = Buffer.from(o.access_token_hash as string);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const settings = await getStoreSettings();
  const items = (o.order_items as any[]).map((i) => ({ name: i.product_name_snapshot, size: i.size_snapshot, color: i.color_snapshot, quantity: i.quantity, unitPriceCents: i.unit_price_cents, lineTotalCents: i.line_total_cents }));
  const view: OrderView = {
    id: o.id, orderNumber: o.order_number, status: o.status, createdAt: o.created_at, customerName: o.customers?.name ?? null, items,
    subtotalCents: o.subtotal_cents, discountCents: o.discount_total_cents, shippingCents: o.shipping_cents, totalCents: o.grand_total_cents,
    couponCode: o.coupon_code_snapshot, whatsappLink: null, paymentReceivedAt: o.payment_received_at ?? null,
    storeName: settings.store_name, logoUrl: settings.logo_url,
  };
  if (settings.whatsapp_number) {
    view.whatsappLink = buildWhatsAppLink(settings.whatsapp_number, buildOrderMessage({
      storeName: settings.store_name, orderNumber: o.order_number, items, subtotalCents: o.subtotal_cents, discountCents: o.discount_total_cents,
      shippingCents: o.shipping_cents, totalCents: o.grand_total_cents, customerName: view.customerName, couponCode: o.coupon_code_snapshot, notes: o.customer_notes,
      receiptUrl: `${siteUrl()}/pedido/${o.id}?t=${encodeURIComponent(token)}`,
    }));
  }
  return view;
}
export { availableStock };
