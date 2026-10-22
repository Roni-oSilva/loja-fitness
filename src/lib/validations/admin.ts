import { z } from "zod";
import { emptyToNull, hexColor, httpsUrl, linkSchema, optionalText, slugSchema, uuid } from "./common";
import { parseBRLToCents } from "../money";

const money = z.string().trim().transform((v, ctx) => {
  const c = parseBRLToCents(v);
  if (c == null) { ctx.addIssue({ code: "custom", message: "Valor inválido" }); return z.NEVER; }
  return c;
});
const optionalMoney = z.preprocess((v) => (v === "" || v == null ? null : v), money.nullable());
const optionalDate = z.preprocess((v) => (v === "" || v == null ? null : v), z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Data inválida").transform((s) => new Date(s).toISOString()).nullable());
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const intField = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
  description: optionalText(500),
  image_url: emptyToNull(z.string().trim().max(1000)),
  sort_order: intField(0, 9999).default(0),
  is_active: checkbox,
});

export const variantSchema = z.object({
  id: uuid.optional(),
  size: optionalText(20),
  color: optionalText(40),
  sku: optionalText(60),
  price_override_cents: optionalMoney,
  is_active: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: slugSchema,
  short_description: optionalText(280),
  description: optionalText(8000),
  category_id: emptyToNull(uuid),
  base_price_cents: money,
  sale_price_cents: optionalMoney,
  sale_starts_at: optionalDate,
  sale_ends_at: optionalDate,
  sku: optionalText(60),
  status: z.enum(["draft", "published", "archived"]),
  is_featured: checkbox,
  badge: optionalText(24),
  size_guide: optionalText(4000),
  care_instructions: optionalText(2000),
  seo_title: optionalText(70),
  seo_description: optionalText(160),
}).superRefine((v, ctx) => {
  if (v.sale_price_cents != null && v.sale_price_cents >= v.base_price_cents)
    ctx.addIssue({ code: "custom", path: ["sale_price_cents"], message: "O preço promocional deve ser menor que o preço" });
  if (v.sale_starts_at && v.sale_ends_at && v.sale_ends_at <= v.sale_starts_at)
    ctx.addIssue({ code: "custom", path: ["sale_ends_at"], message: "O fim deve ser posterior ao início" });
});

export const stockAdjustSchema = z.object({
  variant_id: uuid,
  type: z.enum(["entry", "exit", "adjustment"]),
  quantity: z.coerce.number().int().min(-100000).max(100000).refine((n) => n !== 0, "Informe uma quantidade diferente de zero"),
  reason: z.string().trim().min(3, "Informe o motivo").max(300),
}).transform((v) => ({
  variant_id: v.variant_id, type: v.type, reason: v.reason,
  // entrada e saída são informadas em módulo; ajuste é um delta com sinal
  delta: v.type === "entry" ? Math.abs(v.quantity) : v.type === "exit" ? -Math.abs(v.quantity) : v.quantity,
}));

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/, "Use 3–32 letras, números, _ ou -"),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.string().trim(),
  minimum_order_cents: z.preprocess((v) => (v === "" || v == null ? "0" : v), money),
  usage_limit: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(1).max(1000000).nullable()),
  starts_at: optionalDate,
  expires_at: optionalDate,
  eligible_category_ids: z.array(uuid).default([]),
  eligible_product_ids: z.array(uuid).default([]),
  is_active: checkbox,
}).transform((v, ctx) => {
  const val = v.discount_type === "percent" ? Number(v.discount_value.replace(",", ".")) : parseBRLToCents(v.discount_value);
  if (val == null || !Number.isFinite(val) || val <= 0 || (v.discount_type === "percent" && (val > 100 || !Number.isInteger(val)))) {
    ctx.addIssue({ code: "custom", path: ["discount_value"], message: v.discount_type === "percent" ? "Percentual inteiro entre 1 e 100" : "Valor inválido" });
    return z.NEVER;
  }
  if (v.starts_at && v.expires_at && v.expires_at <= v.starts_at) {
    ctx.addIssue({ code: "custom", path: ["expires_at"], message: "A validade deve ser posterior ao início" });
    return z.NEVER;
  }
  return { ...v, discount_value: val };
});

export const bannerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: optionalText(300),
  image_desktop: emptyToNull(z.string().trim().max(1000)),
  image_mobile: emptyToNull(z.string().trim().max(1000)),
  button_label: optionalText(40),
  target_url: emptyToNull(linkSchema),
  starts_at: optionalDate,
  ends_at: optionalDate,
  sort_order: intField(0, 9999).default(0),
  is_active: checkbox,
}).superRefine((v, ctx) => {
  if (v.starts_at && v.ends_at && v.ends_at <= v.starts_at) ctx.addIssue({ code: "custom", path: ["ends_at"], message: "O fim deve ser posterior ao início" });
  if (v.button_label && !v.target_url) ctx.addIssue({ code: "custom", path: ["target_url"], message: "Informe o link do botão" });
});

export const benefitSchema = z.object({ title: z.string().trim().min(2).max(60), description: z.string().trim().max(200) });
export const editorialSchema = z.object({
  title: z.string().trim().min(2).max(80), text: z.string().trim().max(300),
  image_url: emptyToNull(z.string().trim().max(1000)), link: emptyToNull(linkSchema),
});

const whatsapp = z.preprocess((v) => (typeof v === "string" ? v.replace(/\D/g, "") : v), z.string().regex(/^[1-9]\d{9,14}$/, "Use o formato internacional com DDI e DDD (ex.: 5511999998888)").or(z.literal("")))
  .transform((v) => (v === "" ? null : v));

export const settingsSchema = z.object({
  store_name: z.string().trim().min(2).max(60),
  tagline: optionalText(160),
  logo_url: emptyToNull(z.string().trim().max(1000)),
  favicon_url: emptyToNull(z.string().trim().max(1000)),
  theme_primary: hexColor, theme_accent: hexColor, theme_dark: hexColor,
  whatsapp_number: whatsapp,
  contact_email: emptyToNull(z.string().trim().email().max(254)),
  address: optionalText(300),
  instagram_url: emptyToNull(httpsUrl), facebook_url: emptyToNull(httpsUrl),
  tiktok_url: emptyToNull(httpsUrl), youtube_url: emptyToNull(httpsUrl),
  promo_bar_enabled: checkbox,
  promo_bar_text: optionalText(160),
  promo_bar_link: emptyToNull(linkSchema),
  free_shipping_threshold_cents: optionalMoney,
  delivery_info: optionalText(2000),
  returns_text: optionalText(12000), privacy_text: optionalText(20000), terms_text: optionalText(20000),
  hero_title: z.string().trim().min(2).max(120),
  hero_subtitle: z.string().trim().min(2).max(300),
  hero_cta_label: z.string().trim().min(2).max(40), hero_cta_link: linkSchema,
  hero_secondary_label: z.string().trim().min(2).max(40), hero_secondary_link: linkSchema,
  hero_image_url: emptyToNull(z.string().trim().max(1000)),
  hero_image_mobile_url: emptyToNull(z.string().trim().max(1000)),
  featured_title: z.string().trim().min(2).max(60),
  low_stock_threshold: intField(0, 10000),
  seo_title: optionalText(70), seo_description: optionalText(160),
}).superRefine((v, ctx) => {
  if (v.promo_bar_enabled && !v.promo_bar_text) ctx.addIssue({ code: "custom", path: ["promo_bar_text"], message: "Informe o texto da barra promocional" });
});

export const staffUserSchema = z.object({
  email: z.string().trim().email().max(254),
  full_name: z.string().trim().min(2).max(120),
  role: z.enum(["admin", "manager", "editor"]),
  password: z.string().min(12, "Mínimo de 12 caracteres").max(72),
});

export const orderStatusSchema = z.object({
  order_id: uuid,
  status: z.enum(["pending_contact", "awaiting_confirmation", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  note: optionalText(500),
});
