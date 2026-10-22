import { describe, expect, it } from "vitest";
import { applyCoupon, clampQuantity, compareAtCents, computeTotals, discountPercent, effectivePriceCents, findVariant, isSaleActive, needsSelection, subtotalCents, type PricedLine } from "@/lib/pricing";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import type { Coupon, Variant } from "@/lib/types";

const now = new Date("2026-06-15T12:00:00Z");
const product = { base_price_cents: 10000, sale_price_cents: 8000, sale_starts_at: null, sale_ends_at: null };
const line = (over: Partial<PricedLine> = {}): PricedLine => ({ variantId: "v1", productId: "p1", categoryId: "c1", unitPriceCents: 5000, quantity: 2, ...over });
const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: "c", code: "X", discount_type: "percent", discount_value: 10, minimum_order_cents: 0, usage_limit: null, usage_count: 0,
  starts_at: null, expires_at: null, eligible_product_ids: [], eligible_category_ids: [], is_active: true, ...over,
});
const variant = (o: Partial<Variant>): Variant => ({ id: "v", product_id: "p", sku: null, size: null, color: null, price_override_cents: null, stock_quantity: 1, is_active: true, ...o });

describe("dinheiro", () => {
  it("formata e interpreta valores em centavos", () => {
    expect(formatBRL(129990).replace(/\s/g, " ")).toBe("R$ 1.299,90");
    expect(parseBRLToCents("1.299,90")).toBe(129990);
    expect(parseBRLToCents("49,9")).toBe(4990);
    expect(parseBRLToCents("49.90")).toBe(4990);
    expect(parseBRLToCents("R$ 10")).toBe(1000);
    expect(parseBRLToCents("abc")).toBeNull();
    expect(parseBRLToCents("-5")).toBeNull();
  });
  it("evita erro de ponto flutuante (0,1 + 0,2)", () => {
    expect(subtotalCents([line({ unitPriceCents: 10, quantity: 1 }), line({ unitPriceCents: 20, quantity: 1 })])).toBe(30);
  });
});

describe("preço e promoção", () => {
  it("usa promoção apenas dentro da validade", () => {
    expect(effectivePriceCents(product, null, now)).toBe(8000);
    expect(isSaleActive({ ...product, sale_ends_at: "2026-06-01T00:00:00Z" }, now)).toBe(false);
    expect(isSaleActive({ ...product, sale_starts_at: "2026-07-01T00:00:00Z" }, now)).toBe(false);
    expect(effectivePriceCents({ ...product, sale_ends_at: "2026-06-01T00:00:00Z" }, null, now)).toBe(10000);
  });
  it("override da variante prevalece", () => {
    expect(effectivePriceCents(product, { price_override_cents: 9500 }, now)).toBe(9500);
  });
  it("calcula percentual de desconto corretamente e só com preço anterior válido", () => {
    expect(discountPercent(8000, compareAtCents(product, now))).toBe(20);
    expect(discountPercent(10000, compareAtCents({ ...product, sale_price_cents: null }, now))).toBeNull();
    expect(discountPercent(3333, 5000)).toBe(33);
  });
});

describe("totais", () => {
  it("subtotal, desconto e total", () => {
    const t = computeTotals([line()], 1000, null);
    expect(t).toMatchObject({ subtotalCents: 10000, discountCents: 1000, grandTotalCents: 9000, shippingCents: null, shippingToConfirm: true });
  });
  it("desconto nunca excede o subtotal nem fica negativo", () => {
    expect(computeTotals([line()], 99999, null).grandTotalCents).toBe(0);
    expect(computeTotals([line()], -5, null).discountCents).toBe(0);
  });
  it("frete grátis só quando configurado e atingido", () => {
    expect(computeTotals([line()], 0, 10000).shippingCents).toBe(0);
    expect(computeTotals([line()], 0, 20000).shippingCents).toBeNull();
    expect(computeTotals([line()], 0, null).shippingCents).toBeNull();
  });
});

describe("cupons", () => {
  it("percentual e fixo", () => {
    expect(applyCoupon(coupon(), [line()], now)).toEqual({ ok: true, discountCents: 1000 });
    expect(applyCoupon(coupon({ discount_type: "fixed", discount_value: 1500 }), [line()], now)).toEqual({ ok: true, discountCents: 1500 });
    expect(applyCoupon(coupon({ discount_type: "fixed", discount_value: 99999 }), [line()], now)).toEqual({ ok: true, discountCents: 10000 });
  });
  it("arredonda percentual para baixo (nunca a favor do cliente)", () => {
    expect(applyCoupon(coupon({ discount_value: 15 }), [line({ unitPriceCents: 333, quantity: 1 })], now)).toEqual({ ok: true, discountCents: 49 });
  });
  it("rejeita expirado, não iniciado, inativo, esgotado e abaixo do mínimo", () => {
    expect(applyCoupon(coupon({ expires_at: "2026-06-01T00:00:00Z" }), [line()], now)).toEqual({ ok: false, reason: "expired" });
    expect(applyCoupon(coupon({ starts_at: "2026-07-01T00:00:00Z" }), [line()], now)).toEqual({ ok: false, reason: "not_started" });
    expect(applyCoupon(coupon({ is_active: false }), [line()], now)).toEqual({ ok: false, reason: "inactive" });
    expect(applyCoupon(coupon({ usage_limit: 3, usage_count: 3 }), [line()], now)).toEqual({ ok: false, reason: "exhausted" });
    expect(applyCoupon(coupon({ minimum_order_cents: 20000 }), [line()], now)).toEqual({ ok: false, reason: "minimum" });
  });
  it("restringe por produto/categoria elegível", () => {
    const lines = [line({ productId: "p1", unitPriceCents: 4000, quantity: 1 }), line({ variantId: "v2", productId: "p2", categoryId: "c2", unitPriceCents: 6000, quantity: 1 })];
    expect(applyCoupon(coupon({ eligible_product_ids: ["p2"] }), lines, now)).toEqual({ ok: true, discountCents: 600 });
    expect(applyCoupon(coupon({ eligible_category_ids: ["c1"] }), lines, now)).toEqual({ ok: true, discountCents: 400 });
    expect(applyCoupon(coupon({ eligible_product_ids: ["zzz"] }), lines, now)).toEqual({ ok: false, reason: "not_eligible" });
  });
});

describe("variantes e estoque", () => {
  const vs = [variant({ id: "a", size: "M", color: "Preto" }), variant({ id: "b", size: "G", color: "Preto" }), variant({ id: "c", size: "M", color: "Azul", is_active: false })];
  it("só encontra combinações existentes e ativas", () => {
    expect(findVariant(vs, "M", "Preto")?.id).toBe("a");
    expect(findVariant(vs, "G", "Azul")).toBeNull();
    expect(findVariant(vs, "M", "Azul")).toBeNull();
  });
  it("exige seleção quando há opções", () => {
    expect(needsSelection(vs)).toEqual({ size: true, color: true });
    expect(needsSelection([variant({})])).toEqual({ size: false, color: false });
  });
  it("limita a quantidade ao estoque e a 99", () => {
    expect(clampQuantity(10, 3)).toBe(3);
    expect(clampQuantity(0, 3)).toBe(1);
    expect(clampQuantity(-4, 3)).toBe(1);
    expect(clampQuantity(5, 0)).toBe(0);
    expect(clampQuantity(500, 1000)).toBe(99);
    expect(clampQuantity(NaN, 4)).toBe(1);
  });
});
