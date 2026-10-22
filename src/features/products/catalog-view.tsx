import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { SortSelect } from "./sort-select";
import { buildFacets, queryCatalog, toCard, type CatalogQuery, type SortKey } from "@/lib/catalog-filter";
import { getActiveCategories, getPublishedProducts, getStoreSettings } from "@/lib/services/catalog";
import { centsToInput, parseBRLToCents } from "@/lib/money";

export type SP = Record<string, string | string[] | undefined>;
const arr = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]).map((x) => x.slice(0, 40)).slice(0, 20);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const SORTS: Record<string, SortKey> = { novidades: "novidades", "preco-asc": "preco-asc", "preco-desc": "preco-desc", nome: "nome" };

export function parseParams(sp: SP): CatalogQuery & { rawMin: string; rawMax: string } {
  const min = parseBRLToCents(one(sp.min)), max = parseBRLToCents(one(sp.max));
  return {
    q: one(sp.q).trim().slice(0, 80) || undefined, categorySlug: one(sp.categoria) || undefined, minCents: min ?? undefined, maxCents: max ?? undefined,
    sizes: arr(sp.tam), colors: arr(sp.cor), inStock: one(sp.disponivel) === "1", sort: SORTS[one(sp.ordem)] ?? "novidades",
    page: Math.max(1, parseInt(one(sp.pagina), 10) || 1), rawMin: one(sp.min), rawMax: one(sp.max),
  };
}

function qs(sp: SP, over: Record<string, string | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of arr(v)) u.append(k, x);
  for (const [k, v] of Object.entries(over)) { u.delete(k); if (v) u.set(k, v); }
  const s = u.toString();
  return s ? `?${s}` : "";
}

export async function CatalogView({ sp, basePath, fixedCategory, title, subtitle }: { sp: SP; basePath: string; fixedCategory?: string; title: string; subtitle?: string }) {
  const [settings, all, categories] = await Promise.all([getStoreSettings(), getPublishedProducts(), getActiveCategories()]);
  const params = parseParams(sp);
  if (fixedCategory) params.categorySlug = fixedCategory;
  const scope = fixedCategory ? all.filter((p) => p.categories?.slug === fixedCategory) : all;
  const facets = buildFacets(scope);
  const result = queryCatalog(all, { ...params, pageSize: 12 });
  const hasFilters = !!(params.q || params.minCents != null || params.maxCents != null || params.sizes?.length || params.colors?.length || params.inStock || (!fixedCategory && params.categorySlug));
  const usedCats = new Set(all.map((p) => p.categories?.slug));
  const ck = (name: string, v: string, list?: string[]) => <label key={v} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" name={name} value={v} defaultChecked={list?.includes(v)} className="size-5 accent-[--brand]" />{v}</label>;

  return (
    <div className="container-x py-8 sm:py-12">
      <nav aria-label="Você está em" className="mb-3 text-sm text-neutral-600"><Link href="/" className="hover:underline">Início</Link> / <span aria-current="page">{title}</span></nav>
      <h1 className="h-section">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-neutral-700">{subtitle}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <form method="get" action={basePath} className="lg:sticky lg:top-24 lg:self-start" aria-label="Filtros">
          <details className="group rounded-xl border border-neutral-200 lg:border-0 lg:open:block" open={hasFilters ? true : undefined}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-display text-xl font-bold uppercase lg:hidden">Filtros {hasFilters && <span className="size-2 rounded-full bg-brand" aria-label="ativos" />}</summary>
            <div className="space-y-6 p-4 lg:p-0">
              {params.q && <input type="hidden" name="q" value={params.q} />}
              {!fixedCategory && categories.length > 0 && (
                <div><label htmlFor="f-cat" className="label">Categoria</label>
                  <select id="f-cat" name="categoria" defaultValue={params.categorySlug ?? ""} className="field">
                    <option value="">Todas</option>{categories.filter((c) => usedCats.has(c.slug)).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select></div>)}
              <fieldset><legend className="label">Preço (R$)</legend>
                <div className="flex items-center gap-2">
                  <input name="min" inputMode="decimal" aria-label="Preço mínimo" placeholder={centsToInput(facets.minCents).replace(",00", "")} defaultValue={params.rawMin} className="field" />
                  <span aria-hidden>–</span>
                  <input name="max" inputMode="decimal" aria-label="Preço máximo" placeholder={centsToInput(facets.maxCents).replace(",00", "")} defaultValue={params.rawMax} className="field" />
                </div></fieldset>
              {facets.sizes.length > 0 && <fieldset><legend className="label">Tamanho</legend><div className="grid grid-cols-3 gap-x-2">{facets.sizes.map((s) => ck("tam", s, params.sizes))}</div></fieldset>}
              {facets.colors.length > 0 && <fieldset><legend className="label">Cor</legend>{facets.colors.map((c) => ck("cor", c, params.colors))}</fieldset>}
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" name="disponivel" value="1" defaultChecked={params.inStock} className="size-5 accent-[--brand]" />Somente disponíveis</label>
              <input type="hidden" name="ordem" value={params.sort} />
              <div className="flex gap-2"><button type="submit" className="btn btn-dark btn-sm flex-1">Aplicar</button>
                {hasFilters && <Link href={fixedCategory ? basePath : params.q ? `${basePath}?q=${encodeURIComponent(params.q)}` : basePath} className="btn btn-outline btn-sm">Limpar</Link>}</div>
            </div>
          </details>
        </form>

        <section aria-live="polite">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-700">{result.total} {result.total === 1 ? "produto" : "produtos"}{params.q && <> para “<strong>{params.q}</strong>”</>}</p>
            <SortSelect value={params.sort ?? "novidades"} />
          </div>
          {result.items.length ? <ProductGrid items={result.items.map((p) => toCard(p, settings.low_stock_threshold))} priorityCount={4} />
            : <EmptyState title={all.length ? "Nada encontrado" : "Catálogo em preparação"} text={all.length ? "Nenhum produto corresponde aos filtros escolhidos. Tente remover alguns filtros." : "Ainda não há produtos publicados."} href={basePath} cta={hasFilters ? "Limpar filtros" : undefined} />}
          {result.pages > 1 && (
            <nav aria-label="Paginação" className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {result.page > 1 && <Link rel="prev" href={`${basePath}${qs(sp, { pagina: String(result.page - 1) })}`} className="btn btn-outline btn-sm">Anterior</Link>}
              <span className="px-3 text-sm">Página {result.page} de {result.pages}</span>
              {result.page < result.pages && <Link rel="next" href={`${basePath}${qs(sp, { pagina: String(result.page + 1) })}`} className="btn btn-outline btn-sm">Próxima</Link>}
            </nav>)}
        </section>
      </div>
    </div>
  );
}
