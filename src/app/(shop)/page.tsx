import { ProductGrid } from "@/components/product-card";
import { Benefits, CategoryGrid, Editorial, Hero, PromoBanner, Reviews, SectionTitle, SocialGallery } from "@/components/home-sections";
import { EmptyState } from "@/components/empty-state";
import { toCard } from "@/lib/catalog-filter";
import { getActiveBanners, getApprovedReviews, getCategoriesWithCounts, getPublishedProducts, getStoreSettings } from "@/lib/services/catalog";

export default async function HomePage() {
  const [s, products, banners, reviews] = await Promise.all([getStoreSettings(), getPublishedProducts(), getActiveBanners(), getApprovedReviews()]);
  const categories = await getCategoriesWithCounts(products);
  const featured = products.filter((p) => p.is_featured);
  const showcase = (featured.length ? featured : products).slice(0, 8);
  return (
    <>
      <Hero s={s} />
      <CategoryGrid categories={categories} />
      <section className="container-x mt-14 sm:mt-20" aria-labelledby="destaques">
        <div id="destaques"><SectionTitle eyebrow={featured.length ? "Seleção da loja" : "Recém-chegados"} title={featured.length ? s.featured_title : "Novidades"} href="/produtos" /></div>
        {showcase.length ? <ProductGrid items={showcase.map((p) => toCard(p, s.low_stock_threshold))} priorityCount={0} />
          : <EmptyState title="Em breve, novos produtos" text="Estamos preparando o catálogo. Volte em instantes ou fale com a gente pelo contato." href="/contato" cta="Falar com a loja" />}
      </section>
      <PromoBanner banner={banners[0]} />
      <Benefits items={s.benefits} />
      <Editorial blocks={s.editorial} />
      <Reviews reviews={reviews} />
      <SocialGallery s={s} />
    </>
  );
}
