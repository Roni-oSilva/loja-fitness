"use server";
import { z } from "zod";
import { fd, guarded, parse, dbMessage, refresh, type FormState } from "@/features/admin/form-utils";
import { couponSchema } from "@/lib/validations/admin";
import { uuid } from "@/lib/validations/common";

export async function saveCouponAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("coupons", async (_s, db) => {
    const raw = fd(form); const id = typeof raw.id === "string" && raw.id ? raw.id : null;
    if (id && !uuid.safeParse(id).success) return { ok: false, message: "Cupom inválido." };
    const toArr = (v: unknown) => (v == null ? [] : Array.isArray(v) ? v : [v]);
    const p = parse(couponSchema, { ...raw, eligible_category_ids: toArr(raw.eligible_category_ids), eligible_product_ids: toArr(raw.eligible_product_ids) }); if (!p.ok) return p.state;
    const { error } = id ? await db.from("coupons").update(p.data).eq("id", id) : await db.from("coupons").insert(p.data);
    if (error) return { ok: false, message: dbMessage(error), errors: error.code === "23505" ? { code: "Código já existe" } : undefined };
    refresh("/admin/cupons");
    return { ok: true, message: "Cupom salvo.", redirectTo: "/admin/cupons" };
  });
}

export async function toggleCouponAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("coupons", async (_s, db) => {
    const p = parse(z.object({ id: uuid, active: z.enum(["1", "0"]) }), fd(form)); if (!p.ok) return p.state;
    const { error } = await db.from("coupons").update({ is_active: p.data.active === "1" }).eq("id", p.data.id);
    if (error) return { ok: false, message: dbMessage(error) };
    refresh("/admin/cupons");
    return { ok: true, message: "Cupom atualizado." };
  });
}
