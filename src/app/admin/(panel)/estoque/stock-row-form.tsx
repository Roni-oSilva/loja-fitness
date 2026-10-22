"use client";
import { ActionForm } from "@/features/admin/ui";
import { adjustStockAction } from "./actions";

export function StockRowForm({ variantId }: { variantId: string }) {
  return (
    <ActionForm action={adjustStockAction} submitLabel="Registrar" resetOnSuccess className="min-w-72">
      {(e) => (
        <div className="grid grid-cols-[6.5rem_1fr_5rem] gap-2">
          <input type="hidden" name="variant_id" value={variantId} />
          <select name="type" aria-label="Tipo de movimentação" className="field min-h-10 text-sm" defaultValue="entry"><option value="entry">Entrada</option><option value="exit">Saída</option><option value="adjustment">Correção (±)</option></select>
          <input name="reason" aria-label="Motivo" placeholder="Motivo (obrigatório)" maxLength={300} className="field min-h-10 text-sm" aria-invalid={!!e.reason} />
          <input name="quantity" aria-label="Quantidade" type="number" inputMode="numeric" step={1} placeholder="Qtd" className="field min-h-10 text-sm" aria-invalid={!!e.quantity} />
          {(e.reason || e.quantity) && <p role="alert" className="col-span-3 text-xs font-semibold text-red-700">{e.reason ?? e.quantity}</p>}
        </div>)}
    </ActionForm>
  );
}
