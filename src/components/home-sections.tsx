import Link from "next/link";
import { ArrowRight, ArrowUpRight, Dumbbell, Footprints, GlassWater, Hand, Heart, MessageCircle, PackageCheck, ReceiptText, ShieldCheck, ShoppingBag, Sparkles, Star, Wind, Zap, Shirt } from "lucide-react";
import { SafeImage } from "./safe-image";
import { BrandMark } from "./brand-mark";
import { Pointer, TiltCard } from "./animated";
import type { BannerRow } from "@/lib/services/catalog";
import type { Category, StoreSettings } from "@/lib/types";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export interface HeroVisual { url: string; name: string; price: string }

export function Hero({ s, visuals = [] }: { s: StoreSettings; visuals?: HeroVisual[] }) {
  const desktop = s.hero_image_url, mobile = s.hero_image_mobile_url ?? desktop;
  return (
    <section className="px-2 pt-3 sm:px-4" aria-labelledby="hero-title">
      <Pointer className="on-dark relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-ink text-white sm:rounded-[3rem]">
        {/* formas animadas */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="float absolute -right-24 -top-24 size-80 rounded-full bg-brand/30 blur-3xl sm:size-[34rem]" />
          <div className="float-slow absolute -bottom-32 left-1/4 size-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] [background-size:28px_28px]" />
        </div>
        {mobile && <div className="absolute inset-0 -z-10 md:hidden"><SafeImage src={mobile} alt="" priority sizes="100vw" className="object-cover opacity-50" /></div>}
        {desktop && <div className="absolute inset-0 -z-10 hidden md:block"><SafeImage src={desktop} alt="" priority sizes="100vw" className="object-cover object-right opacity-60" /></div>}
        {(mobile || desktop) && <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/75 to-transparent" />}

        <div className="grid items-center gap-10 px-6 py-14 sm:px-12 sm:py-20 lg:grid-cols-[1.25fr_1fr] lg:py-24">
          <div>
            <p className="eyebrow rise"><Sparkles className="size-3.5" aria-hidden />{s.store_name}</p>
            <h1 id="hero-title" style={delay(1)} className="mt-5 max-w-3xl font-display text-[2.9rem] font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]" aria-label={s.hero_title}>
              {s.hero_title.split(" ").map((w, i, a) => <span key={i} aria-hidden className={`word ${i === a.length - 1 ? "text-shimmer" : ""}`} style={{ "--w": i } as React.CSSProperties}>{w}{i < a.length - 1 ? "\u00a0" : ""}</span>)}
            </h1>
            <p style={delay(2)} className="rise mt-6 max-w-xl text-base text-white/80 sm:text-lg">{s.hero_subtitle}</p>
            <div style={delay(3)} className="rise mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={s.hero_cta_link} className="btn btn-primary pulse-ring !min-h-14 !px-9 !text-lg">{s.hero_cta_label}<ArrowRight className="size-5" aria-hidden /></Link>
              <Link href={s.hero_secondary_link} className="btn !min-h-14 border-2 border-white/40 !px-9 text-white hover:bg-white hover:text-ink">{s.hero_secondary_label}</Link>
            </div>
          </div>
          {/* colagem de produtos flutuantes (ou cartão de marca, se ainda não há fotos) */}
          <div aria-hidden className="rise relative hidden h-[26rem] justify-self-center lg:block lg:w-full" style={delay(2)}>
            {visuals.length ? visuals.slice(0, 3).map((v, i) => (
              <TiltCard key={i} className={`absolute w-44 xl:w-52 ${["left-2 top-0 -rotate-6", "right-0 top-16 rotate-6", "left-24 bottom-0 -rotate-2"][i]}`}>
                <div className={i % 2 ? "float" : "float-slow"}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-4 ring-white/90"><SafeImage src={v.url} alt="" sizes="220px" className="object-cover" /></div>
                  <span className="absolute -bottom-3 left-3 rounded-full bg-brand px-3 py-1.5 font-display text-sm font-bold text-ink shadow-lg">{v.price}</span>
                </div>
              </TiltCard>
            )) : (
              <TiltCard className="float relative mx-auto grid size-72 place-items-center rounded-[3rem] bg-white/5 ring-1 ring-white/15 backdrop-blur">
                <BrandMark className="size-44" spin />
              </TiltCard>)}
            <span className="float-slow absolute right-10 top-0 rounded-full bg-white px-4 py-2 font-display text-sm font-bold text-ink shadow-lg">Compra pelo WhatsApp</span>
            <BrandMark className="float absolute -right-2 bottom-4 size-20" spin />
          </div>
        </div>
      </Pointer>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, href, linkLabel }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="reveal mb-8 flex items-end justify-between gap-4 sm:mb-10">
      <div>{eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}<h2 className="h-section">{title}</h2></div>
      {href && <Link href={href} className="btn btn-outline btn-sm hidden shrink-0 sm:inline-flex">{linkLabel ?? "Ver tudo"}<ArrowRight className="size-4" aria-hidden /></Link>}
    </div>
  );
}

const CAT_ICON: Record<string, typeof Zap> = { "roupas-masculinas": Shirt, "roupas-femininas": Sparkles, "camisetas-e-regatas": Shirt, "leggings-e-shorts": Wind, "tenis-esportivos": Footprints, "luvas-e-munhequeiras": Hand, "garrafas-e-acessorios": GlassWater, "equipamentos-de-treino": Dumbbell };
const CAT_TONE = ["bg-ink text-white", "bg-brand text-ink", "bg-graphite text-white", "bg-accent text-ink"];

export function CategoryGrid({ categories }: { categories: (Category & { count: number })[] }) {
  if (!categories.length) return null;
  return (
    <section className="container-x relative mt-16 sm:mt-24" aria-labelledby="cats">
      <div aria-hidden className="float-slow pointer-events-none absolute -left-24 top-10 -z-10 size-72 rounded-full bg-brand/20 blur-3xl" />
      <div id="cats"><SectionTitle eyebrow="Navegue" title="Escolha seu treino" href="/produtos" linkLabel="Ver todos os produtos" /></div>
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {categories.map((c, i) => {
          const Icon = CAT_ICON[c.slug] ?? Zap;
          return (
            <li key={c.id} className="reveal" style={delay(i % 4)}>
              <Link href={`/categoria/${c.slug}`} className={`on-dark lift group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[2rem] p-5 sm:aspect-square ${CAT_TONE[i % CAT_TONE.length]}`}>
                {c.image_url && <SafeImage src={c.image_url} alt="" sizes="(min-width:1024px) 25vw, 50vw" className="object-cover opacity-80 transition duration-700 group-hover:scale-110 motion-reduce:transition-none" />}
                {!c.image_url && <Icon aria-hidden className="absolute -right-4 -top-4 size-40 rotate-12 opacity-20 transition duration-700 group-hover:-rotate-6 group-hover:scale-110" strokeWidth={1.25} />}
                {c.image_url && <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />}
                <span className="relative mb-auto grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur transition group-hover:rotate-6 group-hover:scale-110"><Icon className="size-6" aria-hidden /></span>
                <span className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white text-ink transition duration-300 group-hover:rotate-45"><ArrowUpRight className="size-5" aria-hidden /></span>
                <span className="relative font-display text-2xl font-extrabold leading-tight sm:text-3xl">{c.name}</span>
                <span className="relative mt-1 text-xs opacity-80">{c.count} {c.count === 1 ? "produto" : "produtos"}</span>
              </Link>
            </li>);
        })}
      </ul>
    </section>
  );
}

const STEPS = [
  { Icon: ShoppingBag, title: "Escolha", text: "Navegue, escolha tamanho e cor e monte o seu carrinho." },
  { Icon: MessageCircle, title: "Finalize no WhatsApp", text: "Registramos o pedido e abrimos a conversa com tudo preenchido." },
  { Icon: ReceiptText, title: "Receba o recibo", text: "Você guarda o recibo do pedido e combina frete e pagamento." },
  { Icon: PackageCheck, title: "Combine a entrega", text: "Confirmamos disponibilidade e acertamos os detalhes com você." },
];
export function HowItWorks() {
  return (
    <section className="container-x relative mt-16 sm:mt-24" aria-labelledby="como">
      <div id="como"><SectionTitle eyebrow="Passo a passo" title="Como comprar" /></div>
      <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <span aria-hidden className="absolute left-[12%] right-[12%] top-12 hidden border-t-2 border-dashed border-ink/20 lg:block" />
        {STEPS.map(({ Icon, title, text }, i) => (
          <li key={title} className="reveal lift relative rounded-[2rem] bg-white p-6 ring-1 ring-neutral-200" style={delay(i)}>
            <span className="relative grid size-16 place-items-center rounded-3xl bg-ink text-brand"><Icon className="size-8" aria-hidden /><span className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-brand font-display text-sm font-extrabold text-ink">{i + 1}</span></span>
            <h3 className="mt-5 font-display text-xl font-bold">{title}</h3><p className="mt-1 text-sm text-neutral-700">{text}</p>
          </li>))}
      </ol>
    </section>
  );
}

export function PromoBanner({ banner }: { banner: BannerRow | undefined }) {
  if (!banner) return null;
  const desktop = banner.image_desktop, mobile = banner.image_mobile ?? desktop;
  return (
    <section className="container-x reveal mt-16 sm:mt-24" aria-label="Campanha">
      <div className="on-dark relative isolate flex min-h-80 items-center overflow-hidden rounded-[2.5rem] bg-brand p-7 text-ink sm:p-14">
        <BrandMark className="float absolute -right-10 -top-10 -z-10 size-64 opacity-25 sm:size-96" />
        {mobile && <div className="absolute inset-0 -z-10 md:hidden"><SafeImage src={mobile} alt="" sizes="100vw" className="object-cover" /></div>}
        {desktop && <div className="absolute inset-0 -z-10 hidden md:block"><SafeImage src={desktop} alt="" sizes="1200px" className="object-cover" /></div>}
        {(mobile || desktop) && <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 to-transparent" />}
        <div className={`max-w-xl ${mobile || desktop ? "text-white" : ""}`}>
          <h2 className="font-display text-4xl font-extrabold leading-none sm:text-6xl">{banner.title}</h2>
          {banner.subtitle && <p className="mt-4 text-lg opacity-90">{banner.subtitle}</p>}
          {banner.button_label && banner.target_url && <Link href={banner.target_url} className="btn btn-dark mt-7 !min-h-14 !px-8">{banner.button_label}<ArrowRight className="size-5" aria-hidden /></Link>}
        </div>
      </div>
    </section>
  );
}

const BENEFIT_ICONS = [ShieldCheck, MessageCircle, Heart, Sparkles];
export function Benefits({ items }: { items: StoreSettings["benefits"] }) {
  if (!items.length) return null;
  return (
    <section className="px-2 sm:px-4" aria-label="Benefícios">
      <div className="mx-auto mt-16 max-w-7xl rounded-[2.5rem] bg-mist px-5 py-12 sm:mt-24 sm:rounded-[3.5rem] sm:px-10 sm:py-16">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((b, i) => {
            const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length] as typeof ShieldCheck;
            return (
              <li key={i} className="reveal lift rounded-[2rem] bg-white p-6" style={delay(i)}>
                <span className="grid size-14 place-items-center rounded-2xl bg-ink text-brand"><Icon className="size-7" aria-hidden /></span>
                <h3 className="mt-5 font-display text-xl font-bold">{b.title}</h3><p className="mt-1 text-sm text-neutral-700">{b.description}</p>
              </li>);
          })}
        </ul>
      </div>
    </section>
  );
}

export function Editorial({ blocks }: { blocks: StoreSettings["editorial"] }) {
  if (!blocks.length) return null;
  return (
    <section className="container-x mt-16 grid gap-4 sm:mt-24 md:grid-cols-2 sm:gap-5" aria-label="Coleção">
      {blocks.slice(0, 2).map((b, i) => {
        const body = (
          <div className={`on-dark lift group relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-[2.5rem] p-7 sm:min-h-[28rem] sm:p-10 ${i % 2 ? "bg-brand text-ink" : "bg-ink text-white"}`}>
            {b.image_url ? <SafeImage src={b.image_url} alt="" sizes="(min-width:768px) 50vw, 100vw" className="-z-10 object-cover opacity-70 transition duration-700 group-hover:scale-105 motion-reduce:transition-none" /> : <BrandMark className={`absolute -right-8 -top-8 -z-10 size-56 opacity-30 ${i % 2 ? "" : "float"}`} />}
            {b.image_url && <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 to-transparent" />}
            <h2 className={`font-display text-4xl font-extrabold leading-none sm:text-6xl ${b.image_url ? "text-white" : ""}`}>{b.title}</h2>
            {b.text && <p className={`mt-3 max-w-md ${b.image_url ? "text-white/90" : "opacity-85"}`}>{b.text}</p>}
            {b.link && <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-ink transition group-hover:gap-3">Ver mais<ArrowRight className="size-4" aria-hidden /></span>}
          </div>);
        return <div key={i} className="reveal" style={delay(i)}>{b.link ? <Link href={b.link}>{body}</Link> : body}</div>;
      })}
    </section>
  );
}

export function Reviews({ reviews }: { reviews: { id: string; author_name: string; rating: number; comment: string | null }[] }) {
  if (!reviews.length) return null;
  return (
    <section className="container-x mt-16 sm:mt-24" aria-labelledby="avaliacoes">
      <div id="avaliacoes"><SectionTitle eyebrow="Clientes" title="Avaliações" /></div>
      <ul className="grid gap-4 md:grid-cols-3">
        {reviews.map((r, i) => (
          <li key={r.id} className="reveal lift rounded-[2rem] bg-mist p-6" style={delay(i)}>
            <p className="flex gap-0.5" role="img" aria-label={`Nota ${r.rating} de 5`}>{Array.from({ length: 5 }, (_, k) => <Star key={k} className={`size-4 ${k < r.rating ? "fill-brand text-brand" : "text-neutral-300"}`} aria-hidden />)}</p>
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
    <section className="container-x mt-16 sm:mt-24" aria-labelledby="social">
      <div id="social"><SectionTitle eyebrow="Siga" title="Nas redes" href={s.instagram_url ?? undefined} linkLabel="Ver perfil" /></div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {s.social_gallery.map((p, i) => (
          <li key={i} className="reveal" style={delay(i)}><a href={p.link_url} target="_blank" rel="noopener noreferrer" className="lift relative block aspect-square overflow-hidden rounded-[2rem] bg-mist">
            <SafeImage src={p.image_url} alt={p.alt || "Publicação da loja"} sizes="(min-width:640px) 25vw, 50vw" className="object-cover" /></a></li>
        ))}
      </ul>
    </section>
  );
}
