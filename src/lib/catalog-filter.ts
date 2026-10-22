import { availableStock, compareAtCents, discountPercent, effectivePriceCents, variantOptions } from "./pricing";
import type { ProductWithRelations } from "./types";

export type SortKey = "novidades" | "preco-asc" | "preco-desc" | "nome";
export interface CatalogQuery {
  q?: string; categorySlug?: string; minCents?: number; maxCents?: number;
  sizes?: string[]; colors?: string[]; inStock?: boolean; sort?: SortKey; page?: number; pageSize?: number;
}

export interface ProductCardData {
  id: string; name: string; slug: string; image: { url: string; alt: string } | null;
  priceCents: number; compareAtCents: number | null; discountPercent: number | null; badge: string | null;
  sizes: string[]; colors: string[]; inStock: boolean; lowStock: boolean; categoryName: string | null;
  defaultVariantId: string | null; // preenchido só quando não há opções a escolher (compra rápida)
}

export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function toCard(p: ProductWithRelations, lowStockThreshold = 5, now = new Date()): ProductCardData {
  const active = p.product_variants.filter((v) => v.is_active);
  const stock = availableStock(active);
  const prices = active.map((v) => effectivePriceCents(p, v, now));
  const priceCents = prices.length ? Math.min(...prices) : effectivePriceCents(p, null, now);
  const compare = active.some((v) => v.price_override_cents != null) ? null : compareAtCents(p, now);
  const img = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
  const opts = variantOptions(active);
  const single = active.length === 1 && !opts.sizes.length && !opts.colors.length ? active[0] : undefined;
  return {
    id: p.id, name: p.name, slug: p.slug, image: img ? { url: img.image_url, alt: img.alt_text || p.name } : null,
    priceCents, compareAtCents: compare, discountPercent: discountPercent(priceCents, compare), badge: p.badge,
    sizes: opts.sizes, colors: opts.colors, inStock: stock > 0, lowStock: stock > 0 && stock <= lowStockThreshold,
    categoryName: p.categories?.name ?? null, defaultVariantId: single && single.stock_quantity > 0 ? single.id : null,
  };
}

export interface CatalogResult { items: ProductWithRelations[]; total: number; page: number; pages: number }

export function queryCatalog(all: ProductWithRelations[], q: CatalogQuery, now = new Date()): CatalogResult {
  const pageSize = q.pageSize ?? 12;
  const text = q.q ? norm(q.q.trim()) : "";
  const sizes = (q.sizes ?? []).map(norm), colors = (q.colors ?? []).map(norm);
  let list = all.filter((p) => {
    if (q.categorySlug && p.categories?.slug !== q.categorySlug) return false;
    if (text && !norm(`${p.name} ${p.short_description ?? ""} ${p.description ?? ""}`).includes(text)) return false;
    const active = p.product_variants.filter((v) => v.is_active);
    if (sizes.length || colors.length || q.inStock) {
      const match = active.some((v) =>
        (!sizes.length || (v.size != null && sizes.includes(norm(v.size)))) &&
        (!colors.length || (v.color != null && colors.includes(norm(v.color)))) &&
        (!q.inStock || v.stock_quantity > 0));
      if (!match) return false;
    }
    const price = Math.min(...(active.length ? active.map((v) => effectivePriceCents(p, v, now)) : [effectivePriceCents(p, null, now)]));
    if (q.minCents != null && price < q.minCents) return false;
    if (q.maxCents != null && price > q.maxCents) return false;
    return true;
  });
  const price = (p: ProductWithRelations) => Math.min(...(p.product_variants.filter((v) => v.is_active).map((v) => effectivePriceCents(p, v, now)).concat(effectivePriceCents(p, null, now))));
  const sort = q.sort ?? "novidades";
  list = [...list].sort((a, b) =>
    sort === "preco-asc" ? price(a) - price(b) :
    sort === "preco-desc" ? price(b) - price(a) :
    sort === "nome" ? a.name.localeCompare(b.name, "pt-BR") :
    b.created_at.localeCompare(a.created_at));
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const page = Math.min(Math.max(q.page ?? 1, 1), pages);
  return { items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pages };
}

export interface Facets { sizes: string[]; colors: string[]; minCents: number; maxCents: number }
export function buildFacets(all: ProductWithRelations[], now = new Date()): Facets {
  const sizes = new Set<string>(), colors = new Set<string>(); let min = Infinity, max = 0;
  for (const p of all) for (const v of p.product_variants.filter((v) => v.is_active)) {
    if (v.size) sizes.add(v.size); if (v.color) colors.add(v.color);
    const pr = effectivePriceCents(p, v, now); min = Math.min(min, pr); max = Math.max(max, pr);
  }
  const order = ["PP", "P", "M", "G", "GG", "XG"];
  const rank = (s: string) => { const i = order.indexOf(s.toUpperCase()); return i === -1 ? 100 : i; };
  return { sizes: [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "pt-BR", { numeric: true })), colors: [...colors].sort((a, b) => a.localeCompare(b, "pt-BR")), minCents: min === Infinity ? 0 : min, maxCents: max };
}
