import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/money";
import { ActionForm } from "@/features/admin/ui";
import { NoRows, PageHeader, Panel, Pill, TableWrap, Td, Th, dt } from "@/features/admin/ui-server";
import { CouponForm } from "./coupon-form";
import { toggleCouponAction } from "./actions";

export const metadata = { title: "Cupons" };

export default async function Coupons({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  await requireStaff("coupons");
  const { editar } = await searchParams;
  const db = (await createClient())!;
  const [{ data: cps }, { data: cats }, { data: prods }] = await Promise.all([db.from("coupons").select("*").order("created_at", { ascending: false }), db.from("categories").select("id, name").order("name"), db.from("products").select("id, name").neq("status", "archived").order("name").limit(500)]);
  const editing = (cps ?? []).find((c) => c.id === editar);
  return (
    <>
      <PageHeader title="Cupons" />
      <TableWrap>
        <thead className="bg-mist"><tr><Th>Código</Th><Th>Desconto</Th><Th>Mínimo</Th><Th>Usos</Th><Th>Validade</Th><Th>Estado</Th><Th /></tr></thead>
        <tbody className="divide-y divide-neutral-100">
          {(cps ?? []).length ? (cps ?? []).map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) <= new Date();
            return (<tr key={c.id}><Td className="font-bold">{c.code}</Td><Td>{c.discount_type === "percent" ? `${c.discount_value}%` : formatBRL(c.discount_value)}</Td><Td>{c.minimum_order_cents ? formatBRL(c.minimum_order_cents) : "—"}</Td>
              <Td>{c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</Td><Td>{c.expires_at ? <span className={expired ? "font-bold text-red-700" : ""}>{expired ? "Expirou " : "Até "}{dt(c.expires_at)}</span> : "Sem validade"}</Td>
              <Td><Pill ok={c.is_active && !expired} yes="Ativo" no={expired ? "Expirado" : "Inativo"} /></Td>
              <Td><div className="flex gap-2"><Link href={`/admin/cupons?editar=${c.id}`} className="btn btn-outline btn-sm">Editar</Link>
                <ActionForm action={toggleCouponAction} submitLabel={c.is_active ? "Desativar" : "Ativar"}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={c.is_active ? "0" : "1"} /></ActionForm></div></Td></tr>);
          }) : <NoRows cols={7} text="Nenhum cupom cadastrado." />}
        </tbody>
      </TableWrap>
      <Panel title={editing ? `Editar ${editing.code}` : "Novo cupom"} className="mt-6">
        <CouponForm c={editing} categories={cats ?? []} products={prods ?? []} />
        {editing && <Link href="/admin/cupons" className="mt-3 inline-block text-sm underline">Cancelar edição</Link>}
      </Panel>
    </>
  );
}
