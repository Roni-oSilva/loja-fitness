import type { MetadataRoute } from "next";
import { getActiveCategories, getPublishedProducts } from "@/lib/services/catalog";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, cats] = await Promise.all([getPublishedProducts().catch(() => []), getActiveCategories().catch(() => [])]);
  const fixed = ["", "/produtos", "/contato", "/trocas-e-devolucoes", "/politica-de-gestao", "/politica-de-privacidade", "/termos-de-uso"].map((p) => ({ url: `${base}${p}` }));
  return [...fixed, ...cats.map((c) => ({ url: `${base}/categoria/${c.slug}` })), ...products.map((p) => ({ url: `${base}/produto/${p.slug}` }))];
}
