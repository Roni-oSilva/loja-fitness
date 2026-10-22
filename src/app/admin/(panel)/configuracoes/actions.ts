"use server";
import { z } from "zod";
import { fd, guarded, parse, dbMessage, refresh, zodErrors, type FormState } from "@/features/admin/form-utils";
import { benefitSchema, editorialSchema, settingsSchema } from "@/lib/validations/admin";
import { httpsUrl } from "@/lib/validations/common";

const json = (v: unknown) => { try { return JSON.parse(String(v ?? "[]")); } catch { return null; } };
const social = z.object({ image_url: z.string().trim().max(1000), link_url: httpsUrl, alt: z.string().trim().max(120).default("") });

export async function saveSettingsAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("settings", async (_s, db) => {
    const raw = fd(form);
    const p = parse(settingsSchema, raw); if (!p.ok) return p.state;
    const rows = (k: string) => { const a = json(raw[k]); return Array.isArray(a) ? a : null; };
    const b = rows("benefits_json"), ed = rows("editorial_json"), so = rows("social_json");
    if (!b || !ed || !so) return { ok: false, message: "Dados de seções inválidos." };
    const benefits = z.array(benefitSchema).max(8).safeParse(b.filter((x: any) => x?.title?.trim()));
    const editorial = z.array(editorialSchema).max(4).safeParse(ed.filter((x: any) => x?.title?.trim()));
    const gallery = z.array(social).max(8).safeParse(so.filter((x: any) => x?.image_url));
    if (!benefits.success) return { ok: false, message: "Revise os benefícios.", errors: { benefits: zodErrors(benefits.error).form ?? "Benefícios inválidos" } };
    if (!editorial.success) return { ok: false, message: "Revise o conteúdo editorial.", errors: { editorial: Object.values(zodErrors(editorial.error))[0] ?? "Inválido" } };
    if (!gallery.success) return { ok: false, message: "Revise as redes sociais: cada imagem precisa de um link https.", errors: { social: Object.values(zodErrors(gallery.error))[0] ?? "Inválido" } };
    const { error } = await db.from("store_settings").update({ ...p.data, benefits: benefits.data, editorial: editorial.data, social_gallery: gallery.data }).eq("id", true);
    if (error) return { ok: false, message: dbMessage(error) };
    refresh("/admin/configuracoes");
    return { ok: true, message: "Configurações salvas." };
  });
}
