import "server-only";
import { createPublicClient } from "../supabase/public";
import type { Category, ProductWithRelations, StoreSettings } from "../types";
import type { Json } from "../json";

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: "Minha Loja Fitness", tagline: null, logo_url: null, favicon_url: null,
  theme_primary: "#FF5A1F", theme_accent: "#B8F531", theme_dark: "#111318", whatsapp_number: null,
  contact_email: null, address: null, instagram_url: null, facebook_url: null, tiktok_url: null, youtube_url: null,
  promo_bar_enabled: false, promo_bar_text: null, promo_bar_link: null, free_shipping_threshold_cents: null,
  delivery_info: null, returns_text: null, privacy_text: null, terms_text: null,
  hero_title: "SEU PRÓXIMO NÍVEL COMEÇA AQUI.",
  hero_subtitle: "Roupas, acessórios e equipamentos para acompanhar cada treino, superar limites e transformar sua rotina.",
  hero_cta_label: "COMPRAR AGORA", hero_cta_link: "/produtos", hero_secondary_label: "EXPLORAR COLEÇÃO",
  hero_secondary_link: "/produtos?ordem=novidades", hero_image_url: null, hero_image_mobile_url: null,
  featured_title: "Em destaque", benefits: [], editorial: [], social_gallery: [], low_stock_threshold: 5,
  seo_title: null, seo_description: null,
};

const PRODUCT_SELECT = "*, product_images(*), product_variants(*), categories(name, slug)";

export async function getStoreSettings(): Promise<StoreSettings> {
  const db = createPublicClient();
  if (!db) return DEFAULT_SETTINGS;
  const { data, error } = await db.from("store_settings").select("*").maybeSingle();
  if (error || !data) { if (error) console.error("[catalog] settings", error.code); return DEFAULT_SETTINGS; }
  const { id: _id, updated_at: _u, ...rest } = data as Record<string, Json>;
  return { ...DEFAULT_SETTINGS, ...(rest as unknown as StoreSettings) };
}

export async function getPublishedProducts(): Promise<ProductWithRelations[]> {
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("products").select(PRODUCT_SELECT).eq("status", "published").order("created_at", { ascending: false }).limit(1000);
  if (error) { console.error("[catalog] products", error.code); throw new Error("Não foi possível carregar os produtos."); }
  return (data ?? []) as unknown as ProductWithRelations[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const db = createPublicClient();
  if (!db) return null;
  const { data, error } = await db.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) { console.error("[catalog] product", error.code); throw new Error("Não foi possível carregar o produto."); }
  return (data as unknown as ProductWithRelations) ?? null;
}

export async function getActiveCategories(): Promise<Category[]> {
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("categories").select("*").eq("is_active", true).order("sort_order").order("name");
  if (error) { console.error("[catalog] categories", error.code); return []; }
  return (data ?? []) as Category[];
}

/** Categorias ativas que possuem ao menos um produto publicado COM estoque, com contagem real. */
export async function getCategoriesWithCounts(products?: ProductWithRelations[]) {
  const [cats, prods] = await Promise.all([getActiveCategories(), products ? Promise.resolve(products) : getPublishedProducts()]);
  return cats.map((c) => ({ ...c, count: prods.filter((p) => p.category_id === c.id).length })).filter((c) => c.count > 0);
}

export interface BannerRow {
  id: string; title: string; subtitle: string | null; image_desktop: string | null; image_mobile: string | null;
  button_label: string | null; target_url: string | null;
}
export async function getActiveBanners(): Promise<BannerRow[]> {
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("banners").select("*").eq("is_active", true).order("sort_order");
  if (error) { console.error("[catalog] banners", error.code); return []; }
  const now = Date.now();
  return ((data ?? []) as (BannerRow & { starts_at: string | null; ends_at: string | null })[])
    .filter((b) => (!b.starts_at || Date.parse(b.starts_at) <= now) && (!b.ends_at || Date.parse(b.ends_at) > now));
}

export async function getApprovedReviews(limit = 6) {
  const db = createPublicClient();
  if (!db) return [];
  const { data } = await db.from("reviews").select("id, author_name, rating, comment").eq("is_approved", true).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as { id: string; author_name: string; rating: number; comment: string | null }[];
}
