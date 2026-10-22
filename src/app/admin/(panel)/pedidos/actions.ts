"use server";
import { z } from "zod";
import { fd, guarded, parse, dbMessage, refresh, type FormState } from "@/features/admin/form-utils";
import { orderStatusSchema } from "@/lib/validations/admin";
import { uuid, optionalText } from "@/lib/validations/common";

export async function updateStatusAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("orders", async (_s, db) => {
    const p = parse(orderStatusSchema, fd(form)); if (!p.ok) return p.state;
    const { error } = await db.rpc("admin_set_order_status", { p_order: p.data.order_id, p_new: p.data.status, p_note: p.data.note });
    if (error) return { ok: false, message: dbMessage(error) };
    refresh(`/admin/pedidos/${p.data.order_id}`, "/admin/pedidos", "/admin/estoque", "/admin");
    return { ok: true, message: "Status atualizado." };
  });
}

export async function saveOrderNotesAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("orders", async (_s, db) => {
    const p = parse(z.object({ order_id: uuid, admin_notes: optionalText(2000) }), fd(form)); if (!p.ok) return p.state;
    const { error } = await db.from("orders").update({ admin_notes: p.data.admin_notes }).eq("id", p.data.order_id);
    if (error) return { ok: false, message: dbMessage(error) };
    refresh(`/admin/pedidos/${p.data.order_id}`);
    return { ok: true, message: "Observações salvas." };
  });
}

/** Registra (ou remove) a confirmação de pagamento recebido — informação manual, feita pela loja. */
export async function setPaymentAction(_: FormState, form: FormData): Promise<FormState> {
  return guarded("orders", async (_s, db) => {
    const p = parse(z.object({ order_id: uuid, received: z.enum(["1", "0"]) }), fd(form)); if (!p.ok) return p.state;
    const { data: o } = await db.from("orders").select("status").eq("id", p.data.order_id).maybeSingle();
    if (!o) return { ok: false, message: "Pedido não encontrado." };
    if (p.data.received === "1" && !["confirmed", "processing", "shipped", "delivered"].includes(o.status))
      return { ok: false, message: "Confirme o pedido antes de registrar o pagamento." };
    const { error } = await db.from("orders").update({ payment_received_at: p.data.received === "1" ? new Date().toISOString() : null }).eq("id", p.data.order_id);
    if (error) return { ok: false, message: dbMessage(error) };
    refresh(`/admin/pedidos/${p.data.order_id}`, "/admin");
    return { ok: true, message: p.data.received === "1" ? "Pagamento registrado." : "Registro de pagamento removido." };
  });
}
