import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/money";
import { NoRows, PageHeader, TableWrap, Td, Th, dt } from "@/features/admin/ui-server";

export const metadata = { title: "Clientes" };

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff("customers");
  const { q: raw } = await searchParams;
  const db = (await createClient())!;
  const term = raw?.replace(/[%_,()]/g, "").trim().slice(0, 60);
  let q = db.from("customers").select("id, name, phone, email, created_at, orders(id, grand_total_cents, status)").order("created_at", { ascending: false }).limit(100);
  if (term) q = q.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, error } = await q;
  return (
    <>
      <PageHeader title="Clientes" subtitle="Somente dados necessários ao atendimento. Nenhum dado de pagamento é armazenado." />
      <form className="mb-4 flex max-w-lg gap-2" role="search"><label htmlFor="q" className="sr-only">Buscar</label><input id="q" name="q" defaultValue={raw} placeholder="Nome, telefone ou e-mail" className="field" /><button className="btn btn-dark btn-sm">Buscar</button></form>
      {error && <p role="alert" className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">Não foi possível carregar os clientes.</p>}
      <TableWrap>
        <thead className="bg-mist"><tr><Th>Nome</Th><Th>Telefone</Th><Th>E-mail</Th><Th>Pedidos</Th><Th>Confirmados</Th><Th>Desde</Th></tr></thead>
        <tbody className="divide-y divide-neutral-100">
          {(data ?? []).length ? (data as any[]).map((c) => {
            const conf = c.orders.filter((o: any) => ["confirmed", "processing", "shipped", "delivered"].includes(o.status));
            return <tr key={c.id}><Td className="font-semibold">{c.name}</Td><Td>{c.phone ?? "—"}</Td><Td>{c.email ?? "—"}</Td><Td>{c.orders.length}</Td><Td>{conf.length} · {formatBRL(conf.reduce((s: number, o: any) => s + o.grand_total_cents, 0))}</Td><Td>{dt(c.created_at)}</Td></tr>;
          }) : <NoRows cols={6} text="Nenhum cliente encontrado." />}
        </tbody>
      </TableWrap>
    </>
  );
}
