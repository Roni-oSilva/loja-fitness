import type { Metadata } from "next";
import { CatalogView, type SP } from "@/features/products/catalog-view";

export const metadata: Metadata = { title: "Busca", robots: { index: false, follow: true } };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim();
  return <CatalogView sp={sp} basePath="/busca" title={q ? `Resultados para “${q.slice(0, 80)}”` : "Buscar produtos"} subtitle={q ? undefined : "Digite o nome ou parte da descrição do produto."} />;
}
