import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";
import { NoRows, PageHeader, StatusBadge, TableWrap, Td, Th, dt } from "@/features/admin/ui-server";

export const metadata = { title: "Pedidos" };
const PAGE = 25;

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; de?: string; ate?: string; pagina?: string }> }) {
  await requireStaff("orders");
  const sp = await searchParams;
  const db = (await createClient())!;
  const page = Math.max(1, parseInt(sp.pagina ?? "1", 10) || 1);
  let q = db.from("orders").select("id, order_number, status, grand_total_cents, created_at, payment_received_at, customers(name, phone)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (sp.status && ORDER_STATUSES.includes(sp.status as OrderStatus)) q = q.eq("status", sp.status);
  if (sp.q) q = q.ilike("order_number", `%${sp.q.replace(/[%_,()]/g, "").slice(0, 30)}%`);
  if (sp.de && !Number.isNaN(Date.parse(sp.de))) q = q.gte("created_at", new Date(sp.de).toISOString());
  if (sp.ate && !Number.isNaN(Date.parse(sp.ate))) q = q.lt("created_at", new Date(Date.parse(sp.ate) + 86_400_000).toISOString());
  const { data, count, error } = await q;
  const rows = (data ?? []) as any[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const link = (p: number) => { const u = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]); u.set("pagina", String(p)); return `/admin/pedidos?${u}`; };
  return (
    <>
      <PageHeader title="Pedidos" subtitle="Pedidos registrados pelo site. Um pedido só é venda após a confirmação com o cliente." />
      <form className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Filtros">
        <div><label htmlFor="q" className="label">Número</label><input id="q" name="q" defaultValue={sp.q} className="field" placeholder="LF-…" /></div>
        <div><label htmlFor="status" className="label">Status</label><select id="status" name="status" defaultValue={sp.status ?? ""} className="field"><option value="">Todos</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}</select></div>
        <div><label htmlFor="de" className="label">De</label><input id="de" name="de" type="date" defaultValue={sp.de} className="field" /></div>
        <div><label htmlFor="ate" className="label">Até</label><input id="ate" name="ate" type="date" defaultValue={sp.ate} className="field" /></div>
        <div className="flex items-end gap-2"><button className="btn btn-dark btn-sm">Filtrar</button><Link href="/admin/pedidos" className="btn btn-outline btn-sm">Limpar</Link></div>
      </form>
      {error && <p role="alert" className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">Não foi possível carregar os pedidos.</p>}
      <TableWrap>
        <thead className="bg-mist"><tr><Th>Pedido</Th><Th>Data</Th><Th>Cliente</Th><Th>Total</Th><Th>Status</Th><Th>Pagamento</Th></tr></thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.length ? rows.map((o) => (
            <tr key={o.id} className="hover:bg-mist/60">
              <Td><Link href={`/admin/pedidos/${o.id}`} className="font-bold underline">{o.order_number}</Link></Td><Td>{dt(o.created_at)}</Td>
              <Td>{o.customers?.name ?? "—"}{o.customers?.phone && <span className="block text-xs text-neutral-600">{o.customers.phone}</span>}</Td>
              <Td className="font-semibold">{formatBRL(o.grand_total_cents)}</Td><Td><StatusBadge status={o.status} /></Td>
              <Td>{o.payment_received_at ? <span className="text-green-800 font-semibold">Recebido</span> : <span className="text-neutral-600">Não registrado</span>}</Td>
            </tr>)) : <NoRows cols={6} text="Nenhum pedido encontrado." />}
        </tbody>
      </TableWrap>
      {pages > 1 && <nav aria-label="Paginação" className="mt-4 flex items-center justify-center gap-3 text-sm">{page > 1 && <Link className="btn btn-outline btn-sm" href={link(page - 1)}>Anterior</Link>}<span>Página {page} de {pages}</span>{page < pages && <Link className="btn btn-outline btn-sm" href={link(page + 1)}>Próxima</Link>}</nav>}
    </>
  );
}
