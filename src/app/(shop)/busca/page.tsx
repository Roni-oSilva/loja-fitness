import type { Metadata } from "next";
import { CatalogView, type SP } from "@/features/products/catalog-view";

export const metadata: Metadata = { title: "Busca", robots: { index: false, follow: true } };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim();
  return <><div className="container-x pt-8"><form action="/busca" role="search" className="flex max-w-xl gap-2"><label htmlFor="q-busca" className="sr-only">Buscar produtos</label><input id="q-busca" name="q" type="search" defaultValue={q} maxLength={80} placeholder="O que você procura?" className="field" /><button className="btn btn-dark" type="submit">Buscar</button></form></div><CatalogView sp={sp} basePath="/busca" title={q ? `Resultados para “${q.slice(0, 80)}”` : "Buscar produtos"} subtitle={q ? undefined : "Digite o nome ou parte da descrição do produto."} /></>;
}
