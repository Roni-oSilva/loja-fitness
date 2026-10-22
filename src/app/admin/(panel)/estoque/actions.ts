"use server";
import { fd, guarded, parse, dbMessage, refresh, type FormState } from "@/features/admin/form-utils";
import { stockAdjustSchema } from "@/lib/validations/admin";

export async function adjustStockAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("stock", async (_s, db) => {
    const p = parse(stockAdjustSchema, fd(form)); if (!p.ok) return p.state;
    const { data, error } = await db.rpc("admin_adjust_stock", { p_variant: p.data.variant_id, p_delta: p.data.delta, p_type: p.data.type, p_reason: p.data.reason });
    if (error) return { ok: false, message: dbMessage(error) };
    refresh("/admin/estoque", "/admin");
    return { ok: true, message: `Saldo atual: ${data}.` };
  });
}
