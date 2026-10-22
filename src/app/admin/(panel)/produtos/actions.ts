"use server";
import { z } from "zod";
import { fd, guarded, parse, dbMessage, refresh, zodErrors, type FormState } from "@/features/admin/form-utils";
import { productSchema, variantSchema } from "@/lib/validations/admin";
import { uuid } from "@/lib/validations/common";

const imagesSchema = z.array(z.object({ url: z.string().trim().max(1000).refine((u) => u.startsWith("https://") || (u.startsWith("/") && !u.startsWith("//")), "URL de imagem inválida"), alt: z.string().trim().max(200).default("") })).max(8);
const json = (v: unknown) => { try { return JSON.parse(String(v ?? "[]")); } catch { return null; } };

export async function saveProductAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("products", async (_s, db) => {
    const raw = fd(form);
    const id = typeof raw.id === "string" && raw.id ? raw.id : null;
    if (id && !uuid.safeParse(id).success) return { ok: false, message: "Produto inválido." };
    const p = parse(productSchema, raw); if (!p.ok) return p.state;

    const rawVariants = json(raw.variants_json), rawImages = json(raw.images_json);
    if (!Array.isArray(rawVariants) || !Array.isArray(rawImages)) return { ok: false, message: "Dados de variantes/imagens inválidos." };
    const vs = z.array(variantSchema.extend({ initial_stock: z.coerce.number().int().min(0).max(100000).default(0) })).min(1, "Cadastre ao menos uma variante").max(100).safeParse(rawVariants);
    if (!vs.success) return { ok: false, message: "Revise as variantes.", errors: { variants: vs.error.issues[0]?.message ?? "Variantes inválidas" } };
    const keys = vs.data.filter((v) => v.is_active).map((v) => `${(v.size ?? "").toLowerCase()}|${(v.color ?? "").toLowerCase()}`);
    if (new Set(keys).size !== keys.length) return { ok: false, message: "Há variantes duplicadas (mesmo tamanho e cor).", errors: { variants: "Variantes duplicadas" } };
    if (vs.data.some((v) => v.price_override_cents != null && v.price_override_cents <= 0)) return { ok: false, message: "Preço da variante deve ser maior que zero.", errors: { variants: "Preço inválido" } };
    const imgs = imagesSchema.safeParse(rawImages);
    if (!imgs.success) return { ok: false, message: "Imagens inválidas.", errors: { images: zodErrors(imgs.error).form ?? "Imagens inválidas" } };

    const { data, error } = await db.rpc("admin_save_product", { p: { ...p.data, id, variants: vs.data, images: imgs.data } });
    if (error) return { ok: false, message: dbMessage(error), errors: error.code === "23505" && /slug/.test(error.message) ? { slug: "Slug já utilizado" } : undefined };
    refresh("/admin/produtos", "/admin/estoque", "/produtos", `/produto/${p.data.slug}`);
    return { ok: true, message: "Produto salvo.", redirectTo: `/admin/produtos/${data as string}` };
  });
}

export async function archiveProductAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("products", async (_s, db) => {
    const p = parse(z.object({ id: uuid, to: z.enum(["archived", "draft"]) }), fd(form)); if (!p.ok) return p.state;
    const { error } = await db.from("products").update({ status: p.data.to }).eq("id", p.data.id);
    if (error) return { ok: false, message: dbMessage(error) };
    refresh("/admin/produtos", "/produtos");
    return { ok: true, message: p.data.to === "archived" ? "Produto arquivado (o histórico dos pedidos foi preservado)." : "Produto movido para rascunho.", redirectTo: "/admin/produtos" };
  });
}
