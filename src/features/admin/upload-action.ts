"use server";
import { randomUUID } from "node:crypto";
import { assertStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { detectImageType } from "@/lib/image-sniff";

const MAX = 5 * 1024 * 1024;
const FOLDERS = new Set(["products", "categories", "banners", "branding", "content"]);

export async function uploadImageAction(form: FormData): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  try {
    const staff = await assertStaff("products").catch(() => assertStaff("banners"));
    if (!rateLimit(`upload:${staff.id}`, 60, 60_000).ok) return { ok: false, message: "Muitos envios seguidos. Aguarde um instante." };
    const file = form.get("file"); const folder = String(form.get("folder") ?? "");
    if (!(file instanceof File) || !FOLDERS.has(folder)) return { ok: false, message: "Arquivo inválido." };
    if (file.size === 0 || file.size > MAX) return { ok: false, message: "A imagem deve ter até 5 MB." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImageType(bytes); // valida o CONTEÚDO, não a extensão/MIME informados
    if (!type) return { ok: false, message: "Formato não suportado. Use JPG, PNG, WebP ou AVIF." };
    const db = await createClient();
    if (!db) return { ok: false, message: "Supabase não configurado." };
    const path = `${folder}/${randomUUID()}.${type.ext}`; // nome gerado: ignora o nome original
    const { error } = await db.storage.from("media").upload(path, bytes, { contentType: type.mime, cacheControl: "31536000", upsert: false });
    if (error) { console.error("[upload]", error.message.slice(0, 120)); return { ok: false, message: "Não foi possível enviar a imagem." }; }
    return { ok: true, url: db.storage.from("media").getPublicUrl(path).data.publicUrl };
  } catch { return { ok: false, message: "Sem permissão para enviar imagens." }; }
}
