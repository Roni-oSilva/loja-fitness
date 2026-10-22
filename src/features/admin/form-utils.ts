import "server-only";
import { ZodError, type ZodType } from "zod";
import { revalidatePath } from "next/cache";
import { assertStaff, ForbiddenError, type Area, type Staff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string>; redirectTo?: string } | null;
export type Db = NonNullable<Awaited<ReturnType<typeof createClient>>>;

export function zodErrors(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[i.path.join(".") || "form"] ??= i.message;
  return out;
}

/** Traduz erros do Postgres/PostgREST em mensagens úteis, sem vazar detalhes internos. */
export function dbMessage(error: { code?: string; message?: string }): string {
  const m = error.message ?? "";
  const tagged = /(OUT_OF_STOCK|INVALID_TRANSITION|INVALID_QUANTITY|INVALID_REASON|NO_VARIANTS|FORBIDDEN|VARIANT_NOT_FOUND|PRODUCT_NOT_FOUND)[:\s]?(.*)/.exec(m);
  if (tagged) {
    const map: Record<string, string> = {
      OUT_OF_STOCK: "Estoque insuficiente para esta operação (o saldo não pode ficar negativo).",
      INVALID_TRANSITION: "Esta mudança de status não é permitida a partir do status atual.",
      INVALID_QUANTITY: "Quantidade inválida para o tipo de movimentação.",
      INVALID_REASON: "Informe o motivo (mínimo 3 caracteres).",
      NO_VARIANTS: "Cadastre ao menos uma variante (tamanho/cor) para o produto.",
      FORBIDDEN: "Você não tem permissão para esta ação.",
      VARIANT_NOT_FOUND: "Variante não encontrada.", PRODUCT_NOT_FOUND: "Produto não encontrado.",
    };
    return map[tagged[1] as string] ?? "Operação não permitida.";
  }
  if (error.code === "23505") {
    if (/slug/.test(m)) return "Já existe um registro com este slug (endereço). Escolha outro.";
    if (/sku/.test(m)) return "Já existe um registro com este SKU.";
    if (/code/.test(m)) return "Já existe um cupom com este código.";
    if (/combo/.test(m)) return "Há variantes duplicadas (mesmo tamanho e cor).";
    return "Já existe um registro com estes dados.";
  }
  if (error.code === "42501") return "Você não tem permissão para esta ação.";
  if (error.code === "23514" || error.code === "22P02") return "Algum valor informado é inválido.";
  if (error.code === "23503") return "Este registro está em uso e não pode ser removido.";
  return "Não foi possível concluir a operação. Tente novamente.";
}

/** Autoriza no servidor, executa e converte exceções em estado de formulário. */
export async function guarded(area: Area, fn: (staff: Staff, db: Db) => Promise<FormState>): Promise<FormState> {
  try {
    const staff = await assertStaff(area);
    const db = await createClient();
    if (!db) return { ok: false, message: "Supabase não configurado." };
    return await fn(staff, db);
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, message: e.message };
    // Next usa exceções para redirect(); repassa
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    console.error("[admin]", (e as Error).message?.slice(0, 200));
    return { ok: false, message: "Erro inesperado. Tente novamente." };
  }
}

export function parse<T>(schema: ZodType<T>, data: unknown): { ok: true; data: T } | { ok: false; state: FormState } {
  const r = schema.safeParse(data);
  return r.success ? { ok: true, data: r.data } : { ok: false, state: { ok: false, message: "Corrija os campos destacados.", errors: zodErrors(r.error) } };
}

export const fd = (f: FormData) => {
  const o: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const k of new Set(f.keys())) { const all = f.getAll(k); o[k] = all.length > 1 ? all : (all[0] as FormDataEntryValue); }
  return o;
};

export const refresh = (...paths: string[]) => { paths.forEach((p) => revalidatePath(p)); revalidatePath("/", "layout"); };
