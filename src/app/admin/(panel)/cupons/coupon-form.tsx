"use client";
import { ActionForm, Check, Field, TextInput } from "@/features/admin/ui";
import { saveCouponAction } from "./actions";
import { centsToInput } from "@/lib/money";

export interface CouponFormData { id?: string; code: string; discount_type: "percent" | "fixed"; discount_value: number; minimum_order_cents: number; usage_limit: number | null; starts_at: string | null; expires_at: string | null; eligible_category_ids: string[]; eligible_product_ids: string[]; is_active: boolean }
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - 3 * 3600_000).toISOString().slice(0, 16) : "");

export function CouponForm({ c, categories, products }: { c?: CouponFormData; categories: { id: string; name: string }[]; products: { id: string; name: string }[] }) {
  return (
    <ActionForm action={saveCouponAction} submitLabel={c ? "Salvar cupom" : "Criar cupom"} className="space-y-4 max-w-3xl" key={c?.id ?? "new"}>
      {(e) => (<>
        {c?.id && <input type="hidden" name="id" value={c.id} />}
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput name="code" label="Código" required defaultValue={c?.code} error={e.code} maxLength={32} className="uppercase" />
          <Field label="Tipo" name="discount_type" error={e.discount_type}><select id="discount_type" name="discount_type" defaultValue={c?.discount_type ?? "percent"} className="field"><option value="percent">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option></select></Field>
          <TextInput name="discount_value" label="Valor" required defaultValue={c ? (c.discount_type === "percent" ? String(c.discount_value) : centsToInput(c.discount_value)) : ""} error={e.discount_value} hint="Ex.: 10 (%) ou 25,00 (R$)" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput name="minimum_order_cents" label="Pedido mínimo (R$)" defaultValue={c?.minimum_order_cents ? centsToInput(c.minimum_order_cents) : ""} error={e.minimum_order_cents} />
          <TextInput name="usage_limit" type="number" min={1} label="Limite de usos" defaultValue={c?.usage_limit ?? ""} error={e.usage_limit} hint="Vazio = ilimitado" />
          <Check name="is_active" label="Cupom ativo" defaultChecked={c?.is_active ?? true} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2"><TextInput name="starts_at" type="datetime-local" label="Válido a partir de" defaultValue={toLocal(c?.starts_at ?? null)} error={e.starts_at} /><TextInput name="expires_at" type="datetime-local" label="Expira em" defaultValue={toLocal(c?.expires_at ?? null)} error={e.expires_at} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categorias elegíveis" name="eligible_category_ids" hint="Vazio = todas. Ctrl/Cmd para várias."><select id="eligible_category_ids" name="eligible_category_ids" multiple size={5} defaultValue={c?.eligible_category_ids ?? []} className="field">{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
          <Field label="Produtos elegíveis" name="eligible_product_ids" hint="Vazio = todos."><select id="eligible_product_ids" name="eligible_product_ids" multiple size={5} defaultValue={c?.eligible_product_ids ?? []} className="field">{products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
        </div>
        <p className="rounded-md bg-amber-50 p-3 text-xs font-semibold text-amber-900">Como a compra termina no WhatsApp, o desconto é validado no registro do pedido e confirmado no atendimento; não há aplicação automática em pagamento externo.</p>
      </>)}
    </ActionForm>
  );
}
