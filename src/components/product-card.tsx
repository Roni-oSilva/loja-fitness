import Link from "next/link";
import { SafeImage } from "./safe-image";
import { FavoriteButton } from "./favorite-button";
import { QuickAdd } from "@/features/cart/quick-add";
import { formatBRL } from "@/lib/money";
import type { ProductCardData } from "@/lib/catalog-filter";

export function ProductCard({ p, priority }: { p: ProductCardData; priority?: boolean }) {
  return (
    <article className="reveal group relative flex flex-col">
      <Link href={`/produto/${p.slug}`} className="lift relative block aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-accent/60 via-mist to-white ring-1 ring-neutral-200/70" aria-label={`Ver ${p.name}`}>
        {p.image ? (
          <SafeImage src={p.image.url} alt={p.image.alt} sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" priority={priority}
            className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        ) : <span className="grid h-full place-items-center text-sm text-neutral-500">Sem imagem</span>}
        <span className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {p.discountPercent && <span className="rounded bg-brand px-2 py-1 font-display text-sm font-bold text-ink">-{p.discountPercent}%</span>}
          {p.badge && <span className="rounded bg-accent px-2 py-1 font-display text-sm font-bold uppercase text-ink">{p.badge}</span>}
          {!p.inStock && <span className="rounded bg-ink px-2 py-1 text-xs font-bold uppercase text-white">Indisponível</span>}
        </span>
      </Link>
      <FavoriteButton productId={p.id} name={p.name} className="absolute right-2 top-2" />
      <div className="mt-3 flex flex-1 flex-col">
        {p.categoryName && <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">{p.categoryName}</p>}
        <h3 className="mt-0.5 font-sans text-base font-semibold leading-snug"><Link href={`/produto/${p.slug}`} className="hover:underline">{p.name}</Link></h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-extrabold">{formatBRL(p.priceCents)}</span>
          {p.compareAtCents && <span className="text-sm text-neutral-600 line-through"><span className="sr-only">De </span>{formatBRL(p.compareAtCents)}</span>}
        </p>
        {(p.sizes.length > 0 || p.colors.length > 0) && (
          <p className="mt-1 text-xs text-neutral-600">
            {p.sizes.length > 0 && <>Tam: {p.sizes.join(" · ")}</>}{p.sizes.length > 0 && p.colors.length > 0 && " | "}
            {p.colors.length > 0 && <>{p.colors.length} {p.colors.length === 1 ? "cor" : "cores"}</>}
          </p>
        )}
        {p.lowStock && <p className="mt-1 text-xs font-semibold text-brand-strong">Últimas unidades</p>}
        <div className="mt-3 flex gap-2 pt-1 mt-auto">
          <Link href={`/produto/${p.slug}`} className="btn btn-outline btn-sm flex-1">Ver</Link>
          {p.defaultVariantId ? <QuickAdd variantId={p.defaultVariantId} name={p.name} slug={p.slug} imageUrl={p.image?.url ?? null} priceCents={p.priceCents} />
            : p.inStock ? <Link href={`/produto/${p.slug}`} className="btn btn-primary btn-sm flex-1">Escolher</Link>
            : <span className="btn btn-sm flex-1 bg-neutral-200 text-neutral-600" aria-disabled>Esgotado</span>}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items, priorityCount = 0 }: { items: ProductCardData[]; priorityCount?: number }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">{items.map((p, i) => <ProductCard key={p.id} p={p} priority={i < priorityCount} />)}</div>;
}
