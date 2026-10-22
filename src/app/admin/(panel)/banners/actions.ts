"use server";
import { z } from "zod";
import { fd, guarded, parse, dbMessage, refresh, type FormState } from "@/features/admin/form-utils";
import { bannerSchema } from "@/lib/validations/admin";
import { uuid } from "@/lib/validations/common";

export async function saveBannerAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("banners", async (_s, db) => {
    const raw = fd(form); const id = typeof raw.id === "string" && raw.id ? raw.id : null;
    if (id && !uuid.safeParse(id).success) return { ok: false, message: "Banner inválido." };
    const p = parse(bannerSchema, raw); if (!p.ok) return p.state;
    const { error } = id ? await db.from("banners").update(p.data).eq("id", id) : await db.from("banners").insert(p.data);
    if (error) return { ok: false, message: dbMessage(error) };
    refresh("/admin/banners");
    return { ok: true, message: "Banner salvo.", redirectTo: "/admin/banners" };
  });
}
export async function deleteBannerAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("banners", async (_s, db) => {
    const p = parse(z.object({ id: uuid }), fd(form)); if (!p.ok) return p.state;
    const { error } = await db.from("banners").delete().eq("id", p.data.id);
    if (error) return { ok: false, message: dbMessage(error) };
    refresh("/admin/banners");
    return { ok: true, message: "Banner removido." };
  });
}
