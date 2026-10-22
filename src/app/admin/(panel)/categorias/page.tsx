import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/features/admin/ui";
import { NoRows, PageHeader, Panel, Pill, TableWrap, Td, Th } from "@/features/admin/ui-server";
import { CategoryForm } from "./category-form";
import { deleteCategoryAction } from "./actions";

export const metadata = { title: "Categorias" };

export default async function Categories({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  await requireStaff("categories");
  const { editar } = await searchParams;
  const db = (await createClient())!;
  const [{ data: cats }, { data: prods }] = await Promise.all([db.from("categories").select("*").order("sort_order").order("name"), db.from("products").select("category_id").neq("status", "archived")]);
  const count = (id: string) => (prods ?? []).filter((p) => p.category_id === id).length;
  const editing = (cats ?? []).find((c) => c.id === editar);
  return (
    <>
      <PageHeader title="Categorias" subtitle="Categorias sem produtos publicados não aparecem na página inicial." />
      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <TableWrap>
          <thead className="bg-mist"><tr><Th>Ordem</Th><Th>Nome</Th><Th>Slug</Th><Th>Produtos</Th><Th>Estado</Th><Th /></tr></thead>
          <tbody className="divide-y divide-neutral-100">
            {(cats ?? []).length ? (cats ?? []).map((c) => (
              <tr key={c.id}><Td>{c.sort_order}</Td><Td className="font-semibold">{c.name}</Td><Td>{c.slug}</Td><Td>{count(c.id)}</Td><Td><Pill ok={c.is_active} yes="Ativa" no="Inativa" /></Td>
                <Td><div className="flex gap-2"><Link href={`/admin/categorias?editar=${c.id}`} className="btn btn-outline btn-sm">Editar</Link><ConfirmButton action={deleteCategoryAction} hidden={{ id: c.id }} label="Excluir" message={`Excluir "${c.name}"? Os ${count(c.id)} produto(s) ficarão sem categoria.`} /></div></Td></tr>)) : <NoRows cols={6} text="Nenhuma categoria cadastrada." />}
          </tbody>
        </TableWrap>
        <Panel title={editing ? `Editar: ${editing.name}` : "Nova categoria"}>
          <CategoryForm c={editing} />
          {editing && <Link href="/admin/categorias" className="mt-3 inline-block text-sm underline">Cancelar edição</Link>}
        </Panel>
      </div>
    </>
  );
}
