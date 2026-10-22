import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, ReceiptText, ShieldCheck } from "lucide-react";
import { Gallery } from "@/features/products/gallery";
import { ProductPurchase } from "@/features/products/product-purchase";
import { BackButton } from "@/components/back-button";
import { ProductGrid } from "@/components/product-card";
import { toCard } from "@/lib/catalog-filter";
import { getProductBySlug, getPublishedProducts, getStoreSettings } from "@/lib/services/catalog";
import { compareAtCents, effectivePriceCents, variantOptions } from "@/lib/pricing";
import { siteUrl } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const img = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
  const desc = p.seo_description ?? p.short_description ?? undefined;
  return {
    title: p.seo_title ?? p.name, description: desc, alternates: { canonical: `/produto/${slug}` },
    openGraph: { title: p.seo_title ?? p.name, description: desc, images: img ? [img.image_url] : undefined, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, s, all] = await Promise.all([getProductBySlug(slug), getStoreSettings(), getPublishedProducts()]);
  if (!p) notFound();
  const active = p.product_variants.filter((v) => v.is_active);
  const opts = variantOptions(active);
  const now = new Date();
  const images = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ url: i.image_url, alt: i.alt_text }));
  const related = all.filter((x) => x.id !== p.id && x.category_id === p.category_id).slice(0, 4);
  const purchaseVariants = active.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock_quantity, priceCents: effectivePriceCents(p, v, now), sku: v.sku ?? p.sku }));
  const hasOverride = active.some((v) => v.price_override_cents != null);
  const inStock = active.some((v) => v.stock_quantity > 0);
  const min = Math.min(...purchaseVariants.map((v) => v.priceCents));
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.short_description ?? p.description ?? undefined,
    image: images.map((i) => i.url), sku: p.sku ?? undefined,
    offers: { "@type": "Offer", url: `${siteUrl()}/produto/${p.slug}`, priceCurrency: "BRL", price: (min / 100).toFixed(2), availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };

  return (
    <div className="container-x py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mb-4"><BackButton fallback={p.categories ? `/categoria/${p.categories.slug}` : "/produtos"} /></div>
      <nav aria-label="Você está em" className="mb-4 text-sm text-neutral-600">
        <Link href="/" className="hover:underline">Início</Link> / {p.categories ? <><Link href={`/categoria/${p.categories.slug}`} className="hover:underline">{p.categories.name}</Link> / </> : null}<span aria-current="page">{p.name}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Gallery images={images} name={p.name} />
        <div>
          {p.is_demo && <p className="mb-2 inline-block rounded bg-neutral-200 px-2 py-1 text-xs font-bold uppercase">Produto de demonstração</p>}
          {p.badge && <p className="eyebrow">{p.badge}</p>}
          <h1 className="font-display text-4xl font-extrabold uppercase leading-none sm:text-5xl">{p.name}</h1>
          {p.short_description && <p className="mt-3 text-neutral-700">{p.short_description}</p>}
          <div className="mt-5">
            <ProductPurchase productId={p.id} name={p.name} slug={p.slug} imageUrl={images[0]?.url ?? null} variants={purchaseVariants} sizes={opts.sizes} colors={opts.colors}
              compareAtCents={hasOverride ? null : compareAtCents(p, now)} lowStockThreshold={s.low_stock_threshold} whatsappEnabled={!!s.whatsapp_number} />
          </div>
          {p.description && <section className="mt-8 border-t border-neutral-200 pt-6"><h2 className="font-display text-2xl font-bold uppercase">Descrição</h2><p className="mt-2 whitespace-pre-line text-neutral-800">{p.description}</p></section>}
          {p.size_guide && <details className="mt-4 border-t border-neutral-200 pt-4"><summary className="cursor-pointer font-display text-2xl font-bold uppercase">Tabela de medidas</summary><p className="mt-2 whitespace-pre-line text-neutral-800">{p.size_guide}</p></details>}
          {p.care_instructions && <details className="mt-4 border-t border-neutral-200 pt-4"><summary className="cursor-pointer font-display text-2xl font-bold uppercase">Conservação</summary><p className="mt-2 whitespace-pre-line text-neutral-800">{p.care_instructions}</p></details>}
          <ul className="mt-6 grid gap-2 sm:grid-cols-3">
            {[[MessageCircle, "Atendimento pelo WhatsApp"], [ShieldCheck, "Valores conferidos no pedido"], [ReceiptText, "Recibo do seu pedido"]].map(([Icon, t], i) => { const I = Icon as typeof ShieldCheck; return <li key={i} className="flex items-center gap-2 rounded-2xl bg-mist px-3 py-2.5 text-xs font-semibold"><I className="size-5 shrink-0 text-brand-strong" aria-hidden />{t as string}</li>; })}
          </ul>
          <p className="mt-6 text-sm text-neutral-600">A compra é finalizada pelo WhatsApp, onde confirmamos disponibilidade, frete e pagamento. <Link href="/trocas-e-devolucoes" className="underline">Trocas e devoluções</Link>.</p>
        </div>
      </div>
      {related.length > 0 && <section className="mt-16" aria-labelledby="rel"><h2 id="rel" className="h-section mb-6">Você também pode gostar</h2><ProductGrid items={related.map((r) => toCard(r, s.low_stock_threshold))} /></section>}
    </div>
  );
}
