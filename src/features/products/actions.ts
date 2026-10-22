"use server";
import { z } from "zod";
import { getPublishedProducts, getStoreSettings } from "@/lib/services/catalog";
import { toCard, type ProductCardData } from "@/lib/catalog-filter";

/** Favoritos ficam no navegador; aqui só resolvemos os IDs em produtos publicados reais. */
export async function getProductsByIdsAction(ids: unknown): Promise<ProductCardData[]> {
  const parsed = z.array(z.string().uuid()).max(100).safeParse(ids);
  if (!parsed.success) return [];
  const [all, s] = await Promise.all([getPublishedProducts(), getStoreSettings()]);
  const set = new Set(parsed.data);
  return all.filter((p) => set.has(p.id)).map((p) => toCard(p, s.low_stock_threshold));
}
