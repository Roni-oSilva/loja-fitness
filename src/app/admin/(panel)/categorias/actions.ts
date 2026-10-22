"use server";
import { z } from "zod";
import { fd, guarded, parse, dbMessage, refresh, type FormState } from "@/features/admin/form-utils";
import { categorySchema } from "@/lib/validations/admin";
import { uuid } from "@/lib/validations/common";

export async function saveCategoryAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("categories", async (_s, db) => {
    const raw = fd(form); const id = typeof raw.id === "string" && raw.id ? raw.id : null;
    if (id && !uuid.safeParse(id).success) return { ok: false, message: "Categoria inválida." };
    const p = parse(categorySchema, raw); if (!p.ok) return p.state;
    const { error } = id ? await db.from("categories").update(p.data).eq("id", id) : await db.from("categories").insert(p.data);
    if (error) return { ok: false, message: dbMessage(error), errors: error.code === "23505" ? { slug: "Slug já utilizado" } : undefined };
    refresh("/admin/categorias");
    return { ok: true, message: "Categoria salva.", redirectTo: "/admin/categorias" };
  });
}

export async function deleteCategoryAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("categories", async (_s, db) => {
    const p = parse(z.object({ id: uuid }), fd(form)); if (!p.ok) return p.state;
    // produtos da categoria ficam sem categoria (FK on delete set null)
    const { error } = await db.from("categories").delete().eq("id", p.data.id);
    if (error) return { ok: false, message: dbMessage(error) };
    refresh("/admin/categorias");
    return { ok: true, message: "Categoria removida." };
  });
}
