"use server";
import { z } from "zod";
import { fd, guarded, parse, refresh, type FormState } from "@/features/admin/form-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { staffUserSchema } from "@/lib/validations/admin";
import { uuid } from "@/lib/validations/common";

/** Somente admin cria contas (service_role, no servidor). Não existe cadastro público. */
export async function createStaffAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("users", async () => {
    const p = parse(staffUserSchema, fd(form)); if (!p.ok) return p.state;
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({ email: p.data.email, password: p.data.password, email_confirm: true });
    if (error || !data.user) return { ok: false, message: /already/i.test(error?.message ?? "") ? "Este e-mail já possui conta." : "Não foi possível criar o usuário." };
    const { error: pe } = await admin.from("profiles").insert({ id: data.user.id, full_name: p.data.full_name, role: p.data.role });
    if (pe) { await admin.auth.admin.deleteUser(data.user.id); return { ok: false, message: "Não foi possível criar o perfil." }; }
    refresh("/admin/usuarios");
    return { ok: true, message: "Usuário criado." };
  });
}

async function adminCount() {
  const { count } = await createAdminClient().from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return count ?? 0;
}

export async function changeRoleAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("users", async (staff) => {
    const p = parse(z.object({ id: uuid, role: z.enum(["admin", "manager", "editor"]) }), fd(form)); if (!p.ok) return p.state;
    const admin = createAdminClient();
    if (p.data.id === staff.id && p.data.role !== "admin") return { ok: false, message: "Você não pode rebaixar o próprio acesso." };
    const { error } = await admin.from("profiles").update({ role: p.data.role }).eq("id", p.data.id);
    if (error) return { ok: false, message: "Não foi possível alterar a função." };
    refresh("/admin/usuarios");
    return { ok: true, message: "Função atualizada." };
  });
}

export async function removeStaffAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("users", async (staff) => {
    const p = parse(z.object({ id: uuid }), fd(form)); if (!p.ok) return p.state;
    if (p.data.id === staff.id) return { ok: false, message: "Você não pode remover a si mesmo." };
    if ((await adminCount()) <= 1) {
      const { data } = await createAdminClient().from("profiles").select("role").eq("id", p.data.id).maybeSingle();
      if (data?.role === "admin") return { ok: false, message: "Não é possível remover o último administrador." };
    }
    const { error } = await createAdminClient().auth.admin.deleteUser(p.data.id);
    if (error) return { ok: false, message: "Não foi possível remover o usuário." };
    refresh("/admin/usuarios");
    return { ok: true, message: "Acesso removido." };
  });
}
