import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/services/catalog";
import { NoRows, PageHeader, Panel, TableWrap, Td, Th, dt } from "@/features/admin/ui-server";
import { StockRowForm } from "./stock-row-form";

export const metadata = { title: "Estoque" };
const TYPE: Record<string, string> = { entry: "Entrada", exit: "Saída", adjustment: "Correção", order_commit: "Baixa por pedido", order_release: "Devolução (cancelamento)" };

export default async function Stock({ searchParams }: { searchParams: Promise<{ q?: string; filtro?: string }> }) {
  await requireStaff("stock");
  const sp = await searchParams;
  const db = (await createClient())!;
  const settings = await getStoreSettings();
  let q = db.from("product_variants").select("id, sku, size, color, stock_quantity, is_active, products!inner(name, sku, status)").neq("products.status", "archived").eq("is_active", true).order("stock_quantity").limit(100);
  if (sp.filtro === "baixo") q = q.gt("stock_quantity", 0).lte("stock_quantity", settings.low_stock_threshold);
  if (sp.filtro === "zerado") q = q.eq("stock_quantity", 0);
  const term = sp.q?.replace(/[%_,()]/g, "").trim().slice(0, 60);
  if (term) q = q.or(`sku.ilike.%${term}%,color.ilike.%${term}%,size.ilike.%${term}%`);
  const [{ data: rows, error }, { data: moves }] = await Promise.all([
    q, db.from("inventory_movements").select("id, movement_type, quantity_delta, stock_after, reason, created_at, created_by, product_variants(sku, size, color, products(name))").order("created_at", { ascending: false }).limit(30),
  ]);
  const list = (rows ?? []) as any[];
  return (
    <>
      <PageHeader title="Estoque" subtitle={`Limite de estoque baixo: ${settings.low_stock_threshold} un. (configurável). O saldo só muda por movimentações registradas.`} />
      <form className="mb-4 flex flex-wrap items-end gap-3" aria-label="Filtros">
        <div className="min-w-48 flex-1"><label htmlFor="q" className="label">SKU, tamanho ou cor</label><input id="q" name="q" defaultValue={sp.q} className="field" /></div>
        <div><label htmlFor="filtro" className="label">Situação</label><select id="filtro" name="filtro" defaultValue={sp.filtro ?? ""} className="field"><option value="">Todos</option><option value="baixo">Estoque baixo</option><option value="zerado">Indisponíveis (zerado)</option></select></div>
        <button className="btn btn-dark btn-sm">Filtrar</button><Link href="/admin/estoque" className="btn btn-outline btn-sm">Limpar</Link>
      </form>
      {error && <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">Não foi possível carregar o estoque.</p>}
      <TableWrap>
        <thead className="bg-mist"><tr><Th>Produto</Th><Th>Variante</Th><Th>SKU</Th><Th>Saldo</Th><Th>Nova movimentação</Th></tr></thead>
        <tbody className="divide-y divide-neutral-100">
          {list.length ? list.map((v) => (
            <tr key={v.id}>
              <Td className="font-semibold">{v.products.name}</Td><Td>{[v.size && `Tam ${v.size}`, v.color].filter(Boolean).join(" · ") || "Única"}</Td><Td>{v.sku ?? v.products.sku ?? "—"}</Td>
              <Td><span className={`font-extrabold ${v.stock_quantity === 0 ? "text-red-700" : v.stock_quantity <= settings.low_stock_threshold ? "text-brand-strong" : ""}`}>{v.stock_quantity}</span>{v.stock_quantity === 0 && <span className="block text-xs text-red-700">Indisponível</span>}{v.stock_quantity > 0 && v.stock_quantity <= settings.low_stock_threshold && <span className="block text-xs text-brand-strong">Baixo</span>}</Td>
              <Td><StockRowForm variantId={v.id} /></Td>
            </tr>)) : <NoRows cols={5} text="Nenhuma variante encontrada." />}
        </tbody>
      </TableWrap>
      <Panel title="Últimas movimentações" className="mt-8">
        <TableWrap>
          <thead className="bg-mist"><tr><Th>Data</Th><Th>Item</Th><Th>Tipo</Th><Th>Qtd</Th><Th>Saldo após</Th><Th>Motivo</Th></tr></thead>
          <tbody className="divide-y divide-neutral-100">
            {(moves ?? []).length ? (moves as any[]).map((m) => (
              <tr key={m.id}><Td>{dt(m.created_at)}</Td><Td>{m.product_variants?.products?.name} <span className="text-neutral-600">{[m.product_variants?.size, m.product_variants?.color].filter(Boolean).join(" · ")}</span></Td><Td>{TYPE[m.movement_type]}</Td>
                <Td className={m.quantity_delta > 0 ? "font-bold text-green-800" : "font-bold text-red-700"}>{m.quantity_delta > 0 ? "+" : ""}{m.quantity_delta}</Td><Td>{m.stock_after}</Td><Td>{m.reason}</Td></tr>)) : <NoRows cols={6} text="Nenhuma movimentação registrada." />}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}
