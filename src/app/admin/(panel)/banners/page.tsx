import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/features/admin/ui";
import { NoRows, PageHeader, Panel, Pill, TableWrap, Td, Th, dt } from "@/features/admin/ui-server";
import { nowMs } from "@/lib/time";
import { BannerForm } from "./banner-form";
import { deleteBannerAction } from "./actions";

export const metadata = { title: "Banners" };

export default async function Banners({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  await requireStaff("banners");
  const { editar } = await searchParams;
  const db = (await createClient())!;
  const { data } = await db.from("banners").select("*").order("sort_order");
  const editing = (data ?? []).find((b) => b.id === editar);
  const now = nowMs();
  return (
    <>
      <PageHeader title="Banners" subtitle="Sem banner ativo no período, a seção de campanha some da página inicial." />
      <TableWrap>
        <thead className="bg-mist"><tr><Th>Ordem</Th><Th>Título</Th><Th>Período</Th><Th>Estado</Th><Th /></tr></thead>
        <tbody className="divide-y divide-neutral-100">
          {(data ?? []).length ? (data ?? []).map((b) => {
            const live = b.is_active && (!b.starts_at || Date.parse(b.starts_at) <= now) && (!b.ends_at || Date.parse(b.ends_at) > now);
            return <tr key={b.id}><Td>{b.sort_order}</Td><Td className="font-semibold">{b.title}</Td><Td>{b.starts_at || b.ends_at ? `${dt(b.starts_at)} → ${dt(b.ends_at)}` : "Sempre"}</Td><Td><Pill ok={live} yes="No ar" no={b.is_active ? "Fora do período" : "Inativo"} /></Td>
              <Td><div className="flex gap-2"><Link href={`/admin/banners?editar=${b.id}`} className="btn btn-outline btn-sm">Editar</Link><ConfirmButton action={deleteBannerAction} hidden={{ id: b.id }} label="Excluir" message={`Excluir o banner "${b.title}"?`} /></div></Td></tr>;
          }) : <NoRows cols={5} text="Nenhum banner cadastrado." />}
        </tbody>
      </TableWrap>
      <Panel title={editing ? `Editar: ${editing.title}` : "Novo banner"} className="mt-6 max-w-4xl"><BannerForm b={editing} />{editing && <Link href="/admin/banners" className="mt-3 inline-block text-sm underline">Cancelar edição</Link>}</Panel>
    </>
  );
}
