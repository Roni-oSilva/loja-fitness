import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PromoBar } from "@/components/promo-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCategoriesWithCounts, getStoreSettings, getPublishedProducts } from "@/lib/services/catalog";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getStoreSettings();
  return {
    title: { default: s.seo_title || s.store_name, template: `%s | ${s.store_name}` },
    description: s.seo_description ?? s.tagline ?? undefined,
    icons: s.favicon_url ? { icon: s.favicon_url } : undefined,
    openGraph: { siteName: s.store_name, locale: "pt_BR", type: "website" },
  };
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const s = await getStoreSettings();
  const products = await getPublishedProducts().catch(() => []);
  const categories = await getCategoriesWithCounts(products).catch(() => []);
  const wa = s.whatsapp_number ? buildWhatsAppLink(s.whatsapp_number, `Olá! Vim pelo site da ${s.store_name}.`) : null;
  const theme = { "--brand": s.theme_primary, "--accent": s.theme_accent, "--ink": s.theme_dark } as CSSProperties;
  return (
    <div style={theme} className="flex min-h-dvh flex-col">
      <div className="scroll-progress" aria-hidden />
      <PromoBar s={s} />
      <SiteHeader storeName={s.store_name} logoUrl={s.logo_url} categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} whatsappLink={wa} />
      <main id="conteudo" className="flex-1">{children}</main>
      <SiteFooter s={s} whatsappLink={wa} categories={categories} />
    </div>
  );
}
