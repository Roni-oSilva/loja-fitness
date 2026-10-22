import { z } from "zod";
import { isSafeLink } from "../utils";

export const uuid = z.string().uuid();
export const slugSchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens");
export const linkSchema = z.string().trim().refine(isSafeLink, "Use um caminho interno (/produtos) ou um link https://");
export const httpsUrl = z.string().trim().url().refine((u) => u.startsWith("https://"), "Use um link https://");
/** Imagens: caminho interno ou https (uploads do Storage). Bloqueia javascript:, data: e http. */
export const imageUrl = z.string().trim().max(1000).refine((u) => u.startsWith("https://") || (u.startsWith("/") && !u.startsWith("//")), "URL de imagem inválida");
export const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (ex.: #FF5A1F)");

/** Converte "" em null para campos opcionais vindos de formulários. */
export const emptyToNull = <T extends z.ZodType>(s: T) =>
  z.preprocess((v) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v), s.nullable());
export const optionalText = (max: number) => emptyToNull(z.string().trim().max(max));
