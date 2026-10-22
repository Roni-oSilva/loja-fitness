import type { Metadata } from "next";
import { CatalogView, type SP } from "@/features/products/catalog-view";

export const revalidate = 60;
export const metadata: Metadata = { title: "Produtos", description: "Roupas, calçados, acessórios e equipamentos de treino.", alternates: { canonical: "/produtos" } };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  return <CatalogView sp={await searchParams} basePath="/produtos" title="Todos os produtos" />;
}
