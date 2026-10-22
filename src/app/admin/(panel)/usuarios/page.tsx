import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionForm, ConfirmButton, Field, TextInput } from "@/features/admin/ui";
import { PageHeader, Panel, TableWrap, Td, Th, dt } from "@/features/admin/ui-server";
import { changeRoleAction, createStaffAction, removeStaffAction } from "./actions";

export const metadata = { title: "Equipe" };
const ROLES = { admin: "Administrador", manager: "Gerente", editor: "Editor" };

export default async function Users() {
  const me = await requireStaff("users");
  const admin = createAdminClient();
  const [{ data: profiles }, { data: list }] = await Promise.all([admin.from("profiles").select("*").order("created_at"), admin.auth.admin.listUsers({ perPage: 200 })]);
  const email = (id: string) => list?.users.find((u) => u.id === id)?.email ?? "—";
  return (
    <>
      <PageHeader title="Equipe" subtitle="Administrador: acesso total · Gerente: pedidos, estoque, cupons, clientes e produtos · Editor: produtos, categorias e banners." />
      <TableWrap>
        <thead className="bg-mist"><tr><Th>Nome</Th><Th>E-mail</Th><Th>Função</Th><Th>Desde</Th><Th /></tr></thead>
        <tbody className="divide-y divide-neutral-100">
          {(profiles ?? []).map((u) => (
            <tr key={u.id}><Td className="font-semibold">{u.full_name || "—"}{u.id === me.id && " (você)"}</Td><Td>{email(u.id)}</Td>
              <Td>{u.id === me.id ? ROLES[u.role as keyof typeof ROLES] : (
                <ActionForm action={changeRoleAction} submitLabel="Alterar" className="min-w-52"><input type="hidden" name="id" value={u.id} />
                  <select name="role" aria-label={`Função de ${u.full_name}`} defaultValue={u.role} className="field min-h-10 text-sm">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></ActionForm>)}</Td>
              <Td>{dt(u.created_at)}</Td><Td>{u.id !== me.id && <ConfirmButton action={removeStaffAction} hidden={{ id: u.id }} label="Remover" message={`Remover o acesso de ${u.full_name || email(u.id)}? A conta será excluída.`} />}</Td></tr>))}
        </tbody>
      </TableWrap>
      <Panel title="Novo usuário" className="mt-6 max-w-2xl">
        <ActionForm action={createStaffAction} submitLabel="Criar usuário" resetOnSuccess className="space-y-4">
          {(e) => (<><div className="grid gap-4 sm:grid-cols-2"><TextInput name="full_name" label="Nome" required error={e.full_name} /><TextInput name="email" type="email" label="E-mail" required error={e.email} autoComplete="off" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><TextInput name="password" type="password" label="Senha inicial (mín. 12)" required error={e.password} autoComplete="new-password" /><Field label="Função" name="role" error={e.role}><select id="role" name="role" defaultValue="editor" className="field">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field></div></>)}
        </ActionForm>
      </Panel>
    </>
  );
}
