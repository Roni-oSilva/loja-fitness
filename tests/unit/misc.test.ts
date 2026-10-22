import { describe, expect, it } from "vitest";
import { canTransition, nextStatuses } from "@/lib/order-status";
import { buildOrderMessage, buildWhatsAppLink, normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { isSafeLink, safeInternalPath, slugify } from "@/lib/utils";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validations/checkout";
import { couponSchema, productSchema, settingsSchema, stockAdjustSchema } from "@/lib/validations/admin";

describe("transições de status", () => {
  it("permite fluxo normal e bloqueia saltos/estados finais", () => {
    expect(canTransition("pending_contact", "confirmed")).toBe(true);
    expect(canTransition("pending_contact", "shipped")).toBe(false);
    expect(canTransition("delivered", "cancelled")).toBe(false);
    expect(nextStatuses("cancelled")).toEqual([]);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
  });
});

describe("WhatsApp", () => {
  const base = { storeName: "Loja X", orderNumber: "LF-ABC12345", items: [{ name: "Camiseta", size: "M", color: "Preto", quantity: 2, unitPriceCents: 5000 }], subtotalCents: 10000, discountCents: 0, shippingCents: null, totalCents: 10000, customerName: "Maria" };
  it("monta mensagem sem afirmar pagamento, com frete a confirmar", () => {
    const m = buildOrderMessage(base);
    expect(m).toContain("Pedido: LF-ABC12345");
    expect(m).toContain("2x Camiseta (Tam M, Preto)");
    expect(m).toContain("Frete: a confirmar");
    expect(m).toContain("Nome: Maria");
    expect(m).not.toMatch(/pago|paguei/i);
    expect(m).not.toContain("Descontos");
  });
  it("inclui desconto/cupom apenas quando existem", () => {
    expect(buildOrderMessage({ ...base, discountCents: 1000, couponCode: "OFF10" })).toContain("(cupom OFF10)");
  });
  it("codifica a URL corretamente", () => {
    const link = buildWhatsAppLink("5511999998888", "Olá & pedido #1\nlinha 2");
    expect(link.startsWith("https://wa.me/5511999998888?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1] as string)).toBe("Olá & pedido #1\nlinha 2");
    expect(link).not.toContain("\n");
  });
  it("normaliza número internacional", () => {
    expect(normalizeWhatsAppNumber("+55 (11) 99999-8888")).toBe("5511999998888");
    expect(normalizeWhatsAppNumber("123")).toBeNull();
  });
});

describe("segurança de URLs", () => {
  it("bloqueia open redirect", () => {
    expect(safeInternalPath("/admin")).toBe("/admin");
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "", null]) expect(safeInternalPath(bad as string, "/x")).toBe("/x");
    expect(isSafeLink("javascript:alert(1)")).toBe(false);
    expect(isSafeLink("http://x.com")).toBe(false);
    expect(isSafeLink("//x.com")).toBe(false);
    expect(isSafeLink("/produtos")).toBe(true);
    expect(isSafeLink("https://x.com/a")).toBe(true);
  });
  it("gera slugs sem acentos", () => expect(slugify("Tênis de Corrida — Pró!")).toBe("tenis-de-corrida-pro"));
});

describe("rate limit", () => {
  it("bloqueia após o limite e informa retry", () => {
    resetRateLimits();
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 60000).ok).toBe(true);
    const r = rateLimit("k", 3, 60000);
    expect(r.ok).toBe(false); expect(r.retryAfterSec).toBeGreaterThan(0);
    expect(rateLimit("outro", 3, 60000).ok).toBe(true);
  });
});

describe("validação no servidor", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const ok = { items: [{ variantId: id, quantity: 1 }], idempotencyKey: "abcdefghijklmnop", name: "Maria", consent: true };
  it("aceita checkout válido e rejeita inválidos", () => {
    expect(checkoutSchema.safeParse(ok).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...ok, items: [] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...ok, items: [{ variantId: id, quantity: 0 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...ok, items: [{ variantId: id, quantity: 100 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...ok, items: [{ variantId: "x", quantity: 1 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...ok, consent: false }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...ok, website: "bot" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...ok, phone: "123" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...ok, phone: "(11) 99999-8888" })).toMatchObject({ success: true, data: { phone: "11999998888" } });
  });
  it("valida produto (preço promocional < preço)", () => {
    const p = { name: "Camiseta", slug: "camiseta", base_price_cents: "99,90", sale_price_cents: "89,90", status: "draft", category_id: "" };
    expect(productSchema.safeParse(p)).toMatchObject({ success: true, data: { base_price_cents: 9990, sale_price_cents: 8990, category_id: null } });
    expect(productSchema.safeParse({ ...p, sale_price_cents: "120,00" }).success).toBe(false);
    expect(productSchema.safeParse({ ...p, base_price_cents: "abc" }).success).toBe(false);
    expect(productSchema.safeParse({ ...p, slug: "Slug Inválido" }).success).toBe(false);
  });
  it("valida cupom", () => {
    const c = { code: "verao10", discount_type: "percent", discount_value: "10", minimum_order_cents: "" };
    expect(couponSchema.safeParse(c)).toMatchObject({ success: true, data: { code: "VERAO10", discount_value: 10, minimum_order_cents: 0 } });
    expect(couponSchema.safeParse({ ...c, discount_value: "150" }).success).toBe(false);
    expect(couponSchema.safeParse({ ...c, discount_type: "fixed", discount_value: "25,50" })).toMatchObject({ success: true, data: { discount_value: 2550 } });
    expect(couponSchema.safeParse({ ...c, starts_at: "2026-02-01", expires_at: "2026-01-01" }).success).toBe(false);
  });
  it("ajuste de estoque: sinal conforme o tipo e justificativa obrigatória", () => {
    const b = { variant_id: id, reason: "Contagem" };
    expect(stockAdjustSchema.parse({ ...b, type: "entry", quantity: "5" }).delta).toBe(5);
    expect(stockAdjustSchema.parse({ ...b, type: "exit", quantity: "5" }).delta).toBe(-5);
    expect(stockAdjustSchema.parse({ ...b, type: "adjustment", quantity: "-3" }).delta).toBe(-3);
    expect(stockAdjustSchema.safeParse({ ...b, type: "entry", quantity: "0" }).success).toBe(false);
    expect(stockAdjustSchema.safeParse({ ...b, reason: "", type: "entry", quantity: "1" }).success).toBe(false);
  });
  it("configurações: link perigoso e whatsapp inválido são recusados", () => {
    const s = { store_name: "Loja", theme_primary: "#FF5A1F", theme_accent: "#B8F531", theme_dark: "#111318", whatsapp_number: "(55) 11 99999-8888", hero_title: "Oi", hero_subtitle: "Oi tudo", hero_cta_label: "Ir", hero_cta_link: "/produtos", hero_secondary_label: "Ir", hero_secondary_link: "/produtos", featured_title: "Em destaque", low_stock_threshold: "5", promo_bar_enabled: "" };
    expect(settingsSchema.safeParse(s)).toMatchObject({ success: true, data: { whatsapp_number: "5511999998888", logo_url: null } });
    expect(settingsSchema.safeParse({ ...s, whatsapp_number: "12" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...s, hero_cta_link: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...s, instagram_url: "http://insta.com/x" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...s, theme_primary: "red" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...s, promo_bar_enabled: "on" }).success).toBe(false); // ativa sem texto
  });
});

import { detectImageType } from "@/lib/image-sniff";
describe("upload de imagens", () => {
  const pad = (a: number[]) => new Uint8Array([...a, ...new Array(16).fill(0)]);
  it("identifica pelo conteúdo e recusa SVG/scripts/extensão enganosa", () => {
    expect(detectImageType(pad([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    expect(detectImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext).toBe("png");
    expect(detectImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 xxxx"))?.ext).toBe("webp");
    expect(detectImageType(new TextEncoder().encode("\0\0\0\x1cftypavif\0\0\0\0avifmif1"))?.ext).toBe("avif");
    expect(detectImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<?php system($_GET['x']); ?>......"))).toBeNull();
    expect(detectImageType(new Uint8Array(4))).toBeNull();
  });
});

import { code39 } from "@/lib/barcode";
describe("código de barras do recibo (Code 39)", () => {
  it("gera barras válidas para o número do pedido", () => {
    const r = code39("LF-AB12CD34");
    expect(r).not.toBeNull();
    // 11 caracteres + 2 delimitadores; cada um = 6 módulos estreitos + 3 largos (3x) = 15; mais 12 espaços entre caracteres
    expect(r!.width).toBe(13 * 15 + 12);
    expect(r!.bars).toHaveLength(13 * 5);
  });
  it("recusa caracteres não suportados", () => {
    expect(code39("LF_áé")).toBeNull();
    expect(code39("")).toBeNull();
    expect(code39("A*B")).toBeNull();
  });
});
