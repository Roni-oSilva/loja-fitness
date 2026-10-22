import type { Coupon, Product, Variant } from "./types";

type PriceProduct = Pick<Product, "base_price_cents" | "sale_price_cents" | "sale_starts_at" | "sale_ends_at">;

export function isSaleActive(p: PriceProduct, now = new Date()): boolean {
  if (p.sale_price_cents == null || p.sale_price_cents >= p.base_price_cents) return false;
  if (p.sale_starts_at && new Date(p.sale_starts_at) > now) return false;
  if (p.sale_ends_at && new Date(p.sale_ends_at) <= now) return false;
  return true;
}

/** Espelha public.effective_price_cents: override da variante > promoção válida > preço base. */
export function effectivePriceCents(p: PriceProduct, v?: Pick<Variant, "price_override_cents"> | null, now = new Date()): number {
  if (v?.price_override_cents != null) return v.price_override_cents;
  return isSaleActive(p, now) ? (p.sale_price_cents as number) : p.base_price_cents;
}

/** Preço "de" (riscado) só quando há promoção realmente válida. */
export function compareAtCents(p: PriceProduct, now = new Date()): number | null {
  return isSaleActive(p, now) ? p.base_price_cents : null;
}

export function discountPercent(currentCents: number, compareAt: number | null): number | null {
  if (compareAt == null || compareAt <= currentCents || compareAt <= 0) return null;
  return Math.round(((compareAt - currentCents) / compareAt) * 100);
}

export interface PricedLine {
  variantId: string; productId: string; categoryId: string | null; unitPriceCents: number; quantity: number;
}
export const lineTotal = (l: Pick<PricedLine, "unitPriceCents" | "quantity">) => l.unitPriceCents * l.quantity;
export const subtotalCents = (lines: PricedLine[]) => lines.reduce((s, l) => s + lineTotal(l), 0);

export type CouponError = "inactive" | "not_started" | "expired" | "exhausted" | "minimum" | "not_eligible";
export type CouponResult = { ok: true; discountCents: number } | { ok: false; reason: CouponError };

export const COUPON_ERROR_MESSAGES: Record<CouponError, string> = {
  inactive: "Cupom inválido.",
  not_started: "Este cupom ainda não está válido.",
  expired: "Este cupom expirou.",
  exhausted: "Este cupom atingiu o limite de utilizações.",
  minimum: "O pedido não atingiu o valor mínimo deste cupom.",
  not_eligible: "Nenhum item do carrinho é elegível a este cupom.",
};

export function applyCoupon(coupon: Coupon, lines: PricedLine[], now = new Date()): CouponResult {
  if (!coupon.is_active) return { ok: false, reason: "inactive" };
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return { ok: false, reason: "not_started" };
  if (coupon.expires_at && new Date(coupon.expires_at) <= now) return { ok: false, reason: "expired" };
  if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) return { ok: false, reason: "exhausted" };
  const subtotal = subtotalCents(lines);
  if (subtotal < coupon.minimum_order_cents) return { ok: false, reason: "minimum" };

  const restricted = coupon.eligible_product_ids.length > 0 || coupon.eligible_category_ids.length > 0;
  const base = restricted
    ? lines.filter((l) => coupon.eligible_product_ids.includes(l.productId) || (l.categoryId != null && coupon.eligible_category_ids.includes(l.categoryId))).reduce((s, l) => s + lineTotal(l), 0)
    : subtotal;
  if (base <= 0) return { ok: false, reason: "not_eligible" };

  const raw = coupon.discount_type === "percent" ? Math.floor((base * coupon.discount_value) / 100) : coupon.discount_value;
  return { ok: true, discountCents: Math.min(raw, base) };
}

export interface Totals { subtotalCents: number; discountCents: number; shippingCents: number | null; grandTotalCents: number; shippingToConfirm: boolean }

/** Frete é "a confirmar" (null) a menos que exista regra real (frete grátis configurado e atingido). */
export function computeTotals(lines: PricedLine[], discountCents: number, freeShippingThresholdCents: number | null): Totals {
  const subtotal = subtotalCents(lines);
  const discount = Math.min(Math.max(discountCents, 0), subtotal);
  const afterDiscount = subtotal - discount;
  const freeShipping = freeShippingThresholdCents != null && afterDiscount >= freeShippingThresholdCents;
  return {
    subtotalCents: subtotal, discountCents: discount,
    shippingCents: freeShipping ? 0 : null, shippingToConfirm: !freeShipping,
    grandTotalCents: afterDiscount,
  };
}

// ---- Variantes e estoque ----
export interface VariantOptions { sizes: string[]; colors: string[] }

export function variantOptions(variants: Variant[]): VariantOptions {
  const act = variants.filter((v) => v.is_active);
  const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x))];
  return { sizes: uniq(act.map((v) => v.size)), colors: uniq(act.map((v) => v.color)) };
}

/** Localiza a variante exata. Retorna null para combinações inexistentes. */
export function findVariant(variants: Variant[], size: string | null, color: string | null): Variant | null {
  return variants.find((v) => v.is_active && (v.size ?? null) === (size ?? null) && (v.color ?? null) === (color ?? null)) ?? null;
}

export function needsSelection(variants: Variant[]): { size: boolean; color: boolean } {
  const o = variantOptions(variants);
  return { size: o.sizes.length > 0, color: o.colors.length > 0 };
}

export function availableStock(variants: Variant[]): number {
  return variants.filter((v) => v.is_active).reduce((s, v) => s + v.stock_quantity, 0);
}

export function clampQuantity(requested: number, stock: number, max = 99): number {
  if (!Number.isFinite(requested)) return stock > 0 ? 1 : 0;
  return Math.max(stock > 0 ? 1 : 0, Math.min(Math.floor(requested), stock, max));
}
