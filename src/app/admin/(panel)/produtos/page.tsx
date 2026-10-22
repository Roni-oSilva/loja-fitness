import Link from "next/link";
import Image from "next/image";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/money";
import { NoRows, LinkBtn, PageHeader, TableWrap, Td, Th } from "@/features/admin/ui-server";
import { SafeImage } from "@/components/safe-image";

export const metadata = { title: "Produtos" };
const PAGE = 25;
const STATUS = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" } as const;

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; pagina?: string }> }) {
  await requireStaff("products");
  const sp = await searchParams; void Image;
  const db = (await createClient())!;
  const page = Math.max(1, parseInt(sp.pagina ?? "1", 10) || 1);
  let q = db.from("products").select("id, name, slug, status, base_price_cents, sale_price_cents, is_featured, is_demo, product_images(image_url, sort_order), product_variants(stock_quantity, is_active), categories(name)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (sp.status && sp.status in STATUS) q = q.eq("status", sp.status as keyof typeof STATUS); else q = q.neq("status", "archived");
  const term = sp.q?.replace(/[%_,()]/g, "").trim().slice(0, 60); if (term) q = q.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  const { data, count, error } = await q;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  return (
    <>
      <PageHeader title="Produtos" action={<LinkBtn href="/admin/produtos/novo">+ Novo produto</LinkBtn>} />
      <form className="mb-4 flex flex-wrap items-end gap-3" aria-label="Filtros">
        <div className="min-w-48 flex-1"><label htmlFor="q" className="label">Nome ou SKU</label><input id="q" name="q" defaultValue={sp.q} className="field" /></div>
        <div><label htmlFor="status" className="label">Status</label><select id="status" name="status" defaultValue={sp.status ?? ""} className="field"><option value="">Ativos (sem arquivados)</option><option value="published">Publicados</option><option value="draft">Rascunhos</option><option value="archived">Arquivados</option></select></div>
        <button className="btn btn-dark btn-sm">Filtrar</button><Link href="/admin/produtos" className="btn btn-outline btn-sm">Limpar</Link>
      </form>
      {error && <p role="alert" className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">Não foi possível carregar os produtos.</p>}
      <TableWrap>
        <thead className="bg-mist"><tr><Th /><Th>Produto</Th><Th>Categoria</Th><Th>Preço</Th><Th>Estoque</Th><Th>Status</Th></tr></thead>
        <tbody className="divide-y divide-neutral-100">
          {(data ?? []).length ? (data as any[]).map((p) => {
            const stock = p.product_variants.filter((v: any) => v.is_active).reduce((s: number, v: any) => s + v.stock_quantity, 0);
            const img = [...p.product_images].sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
            return (
              <tr key={p.id} className="hover:bg-mist/60">
                <Td><span className="relative block size-12 overflow-hidden rounded bg-mist">{img && <SafeImage src={img.image_url} alt="" sizes="48px" className="object-cover" />}</span></Td>
                <Td><Link href={`/admin/produtos/${p.id}`} className="font-bold underline">{p.name}</Link>{p.is_featured && <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold">DESTAQUE</span>}{p.is_demo && <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold">DEMO</span>}</Td>
                <Td>{p.categories?.name ?? "—"}</Td><Td>{formatBRL(p.base_price_cents)}{p.sale_price_cents != null && <span className="block text-xs font-bold text-brand-strong">Promo {formatBRL(p.sale_price_cents)}</span>}</Td>
                <Td className={stock === 0 ? "font-bold text-red-700" : ""}>{stock === 0 ? "Indisponível" : stock}</Td><Td>{STATUS[p.status as keyof typeof STATUS]}</Td>
              </tr>);
          }) : <NoRows cols={6} text="Nenhum produto encontrado." />}
        </tbody>
      </TableWrap>
      {pages > 1 && <nav aria-label="Paginação" className="mt-4 flex items-center justify-center gap-3 text-sm">{page > 1 && <Link className="btn btn-outline btn-sm" href={`/admin/produtos?pagina=${page - 1}`}>Anterior</Link>}<span>Página {page} de {pages}</span>{page < pages && <Link className="btn btn-outline btn-sm" href={`/admin/produtos?pagina=${page + 1}`}>Próxima</Link>}</nav>}
    </>
  );
}
