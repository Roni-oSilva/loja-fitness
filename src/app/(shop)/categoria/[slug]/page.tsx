import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView, type SP } from "@/features/products/catalog-view";
import { getActiveCategories } from "@/lib/services/catalog";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getActiveCategories()).find((c) => c.slug === slug);
  if (!cat) return {};
  return { title: cat.name, description: cat.description ?? `Produtos de ${cat.name}`, alternates: { canonical: `/categoria/${slug}` } };
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const cat = (await getActiveCategories()).find((c) => c.slug === slug);
  if (!cat) notFound();
  return <CatalogView sp={await searchParams} basePath={`/categoria/${slug}`} fixedCategory={slug} title={cat.name} subtitle={cat.description ?? undefined} />;
}
