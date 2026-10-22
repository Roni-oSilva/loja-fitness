import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { SafeImage } from "./safe-image";
import type { BannerRow } from "@/lib/services/catalog";
import type { Category, StoreSettings } from "@/lib/types";

export function Hero({ s }: { s: StoreSettings }) {
  const desktop = s.hero_image_url ?? "/demo/hero.svg";
  const mobile = s.hero_image_mobile_url ?? desktop;
  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink text-white" aria-labelledby="hero-title">
      <div className="absolute inset-0 -z-10 md:hidden"><SafeImage src={mobile} alt="" priority sizes="100vw" className="object-cover opacity-60" /></div>
      <div className="absolute inset-0 -z-10 hidden md:block"><SafeImage src={desktop} alt="" priority sizes="100vw" className="object-cover object-right opacity-70" /></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
      <div className="container-x flex min-h-[28rem] flex-col justify-center py-16 sm:min-h-[34rem] lg:min-h-[40rem]">
        <p className="rise eyebrow !text-accent">{s.store_name}</p>
        <h1 id="hero-title" className="rise mt-3 max-w-3xl font-display text-[3.25rem] font-extrabold uppercase leading-[0.92] sm:text-7xl lg:text-8xl">{s.hero_title}</h1>
        <p className="rise mt-5 max-w-xl text-base text-white/85 sm:text-lg">{s.hero_subtitle}</p>
        <div className="rise mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={s.hero_cta_link} className="btn btn-primary">{s.hero_cta_label}<ArrowRight className="size-5" aria-hidden /></Link>
          <Link href={s.hero_secondary_link} className="btn border-2 border-white text-white hover:bg-white hover:text-ink">{s.hero_secondary_label}</Link>
        </div>
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, href, linkLabel }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 className="h-section">{title}</h2></div>
      {href && <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-bold underline-offset-4 hover:underline sm:inline-flex">{linkLabel ?? "Ver tudo"}<ArrowRight className="size-4" aria-hidden /></Link>}
    </div>
  );
}

export function CategoryGrid({ categories }: { categories: (Category & { count: number })[] }) {
  if (!categories.length) return null;
  return (
    <section className="container-x mt-14 sm:mt-20" aria-labelledby="cats">
      <div id="cats"><SectionTitle eyebrow="Navegue" title="Categorias" href="/produtos" linkLabel="Ver todos os produtos" /></div>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/categoria/${c.slug}`} className="on-dark group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl bg-graphite p-4 text-white sm:aspect-square">
              {c.image_url && <SafeImage src={c.image_url} alt="" sizes="(min-width:1024px) 25vw, 50vw" className="object-cover opacity-80 transition duration-500 group-hover:scale-105 motion-reduce:transition-none" />}
              <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
              <span className="relative font-display text-2xl font-extrabold uppercase leading-none sm:text-3xl">{c.name}</span>
              <span className="relative mt-1 text-xs text-white/80">{c.count} {c.count === 1 ? "produto" : "produtos"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PromoBanner({ banner }: { banner: BannerRow | undefined }) {
  if (!banner) return null;
  const desktop = banner.image_desktop, mobile = banner.image_mobile ?? desktop;
  return (
    <section className="container-x mt-14 sm:mt-20" aria-label="Campanha">
      <div className="on-dark relative isolate flex min-h-72 items-center overflow-hidden rounded-2xl bg-graphite p-6 text-white sm:min-h-80 sm:p-12">
        {mobile && <div className="absolute inset-0 -z-10 md:hidden"><SafeImage src={mobile} alt="" sizes="100vw" className="object-cover opacity-60" /></div>}
        {desktop && <div className="absolute inset-0 -z-10 hidden md:block"><SafeImage src={desktop} alt="" sizes="1200px" className="object-cover opacity-60" /></div>}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 to-transparent" />
        <div className="max-w-xl">
          <h2 className="font-display text-4xl font-extrabold uppercase leading-none sm:text-6xl">{banner.title}</h2>
          {banner.subtitle && <p className="mt-3 text-white/85">{banner.subtitle}</p>}
          {banner.button_label && banner.target_url && <Link href={banner.target_url} className="btn btn-primary mt-6">{banner.button_label}</Link>}
        </div>
      </div>
    </section>
  );
}

export function Benefits({ items }: { items: StoreSettings["benefits"] }) {
  if (!items.length) return null;
  return (
    <section className="mt-14 bg-mist py-12 sm:mt-20" aria-label="Benefícios">
      <ul className="container-x grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((b, i) => (
          <li key={i} className="flex gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink font-display text-xl font-extrabold text-accent" aria-hidden>{i + 1}</span>
            <div><h3 className="font-sans text-base font-bold">{b.title}</h3><p className="mt-1 text-sm text-neutral-700">{b.description}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Editorial({ blocks }: { blocks: StoreSettings["editorial"] }) {
  if (!blocks.length) return null;
  return (
    <section className="container-x mt-14 grid gap-4 sm:mt-20 md:grid-cols-2" aria-label="Coleção">
      {blocks.slice(0, 2).map((b, i) => {
        const body = (
          <div className={`on-dark group relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl p-6 text-white sm:min-h-[28rem] ${i % 2 ? "bg-brand !text-ink" : "bg-ink"}`}>
            {b.image_url && <SafeImage src={b.image_url} alt="" sizes="(min-width:768px) 50vw, 100vw" className="-z-10 object-cover opacity-70 transition duration-500 group-hover:scale-105 motion-reduce:transition-none" />}
            <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 to-transparent" />
            <h2 className="font-display text-4xl font-extrabold uppercase leading-none text-white sm:text-6xl">{b.title}</h2>
            {b.text && <p className="mt-3 max-w-md text-white/90">{b.text}</p>}
          </div>);
        return b.link ? <Link key={i} href={b.link}>{body}</Link> : <div key={i}>{body}</div>;
      })}
    </section>
  );
}

export function Reviews({ reviews }: { reviews: { id: string; author_name: string; rating: number; comment: string | null }[] }) {
  if (!reviews.length) return null;
  return (
    <section className="container-x mt-14 sm:mt-20" aria-labelledby="avaliacoes">
      <div id="avaliacoes"><SectionTitle eyebrow="Clientes" title="Avaliações" /></div>
      <ul className="grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.id} className="card p-5">
            <p className="flex gap-0.5" role="img" aria-label={`Nota ${r.rating} de 5`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-brand text-brand" : "text-neutral-300"}`} aria-hidden />)}</p>
            {r.comment && <p className="mt-3 text-sm">{r.comment}</p>}
            <p className="mt-3 text-sm font-semibold">{r.author_name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SocialGallery({ s }: { s: StoreSettings }) {
  if (!s.social_gallery.length) return null;
  return (
    <section className="container-x mt-14 sm:mt-20" aria-labelledby="social">
      <div id="social"><SectionTitle eyebrow="Siga" title="Nas redes" href={s.instagram_url ?? undefined} linkLabel="Ver perfil" /></div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {s.social_gallery.map((p, i) => (
          <li key={i}><a href={p.link_url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square overflow-hidden rounded-lg bg-mist">
            <SafeImage src={p.image_url} alt={p.alt || "Publicação da loja"} sizes="(min-width:640px) 25vw, 50vw" className="object-cover transition hover:scale-105 motion-reduce:transition-none" /></a></li>
        ))}
      </ul>
    </section>
  );
}
