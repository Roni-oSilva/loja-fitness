import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextStatuses, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { formatBRL } from "@/lib/money";
import { getStoreSettings } from "@/lib/services/catalog";
import { Receipt } from "@/components/receipt";
import { PrintButton } from "@/features/orders/print-button";
import { ActionForm, ConfirmButton, Field, TextArea } from "@/features/admin/ui";
import { PageHeader, Panel, StatusBadge, dt } from "@/features/admin/ui-server";
import { saveOrderNotesAction, setPaymentAction, updateStatusAction } from "../actions";
import type { OrderStatus } from "@/lib/types";

export const metadata = { title: "Pedido" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("orders");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = (await createClient())!;
  const [{ data: o }, { data: hist }, s] = await Promise.all([
    db.from("orders").select("*, customers(name, phone, email), order_items(*)").eq("id", id).maybeSingle(),
    db.from("order_status_history").select("*").eq("order_id", id).order("created_at"), getStoreSettings(),
  ]);
  if (!o) notFound();
  const status = o.status as OrderStatus; const next = nextStatuses(status);
  const items = (o.order_items as any[]).map((i) => ({ name: i.product_name_snapshot, size: i.size_snapshot, color: i.color_snapshot, quantity: i.quantity, lineTotalCents: i.line_total_cents, unit: i.unit_price_cents, sku: i.sku_snapshot }));
  const paid = !!o.payment_received_at;
  return (
    <>
      <PageHeader title={`Pedido ${o.order_number}`} subtitle={`Criado em ${dt(o.created_at)} · atualizado em ${dt(o.updated_at)}`} action={<Link href="/admin/pedidos" className="btn btn-outline btn-sm">← Voltar</Link>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Panel title="Situação">
            <p className="mb-3 flex flex-wrap items-center gap-2"><StatusBadge status={status} /> {paid ? <span className="text-sm font-semibold text-green-800">Pagamento registrado em {dt(o.payment_received_at)}</span> : <span className="text-sm text-neutral-600">Pagamento não registrado</span>}</p>
            {next.length ? (
              <ActionForm action={updateStatusAction} submitLabel="Atualizar status">
                <input type="hidden" name="order_id" value={o.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Novo status" name="status"><select id="status" name="status" className="field" required defaultValue={next[0]}>{next.map((n) => <option key={n} value={n}>{ORDER_STATUS_LABEL[n]}</option>)}</select></Field>
                  <TextArea name="note" label="Observação (opcional)" rows={1} maxLength={500} />
                </div>
                <p className="mt-2 text-xs text-neutral-600">Ao confirmar, o estoque dos itens é baixado (uma única vez). Cancelar um pedido confirmado devolve o estoque.</p>
              </ActionForm>) : <p className="text-sm text-neutral-600">Este pedido está em um estado final.</p>}
            <div className="mt-4 border-t border-neutral-200 pt-4">
              <ActionForm action={setPaymentAction} submitLabel={paid ? "Remover registro de pagamento" : "Registrar pagamento recebido"}>
                <input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="received" value={paid ? "0" : "1"} />
                <p className="text-sm text-neutral-700">O site não processa pagamentos. Registre aqui apenas após receber o valor combinado no WhatsApp.</p>
              </ActionForm>
            </div>
          </Panel>
          <Panel title="Itens">
            <ul className="divide-y divide-neutral-100 text-sm">{items.map((i, k) => <li key={k} className="flex justify-between gap-3 py-2"><span>{i.quantity}× {i.name} {(i.size || i.color) && <span className="text-neutral-600">({[i.size && `Tam ${i.size}`, i.color].filter(Boolean).join(", ")})</span>}{i.sku && <span className="block text-xs text-neutral-500">SKU {i.sku} · {formatBRL(i.unit)} cada</span>}</span><strong>{formatBRL(i.lineTotalCents)}</strong></li>)}</ul>
            <dl className="mt-3 space-y-1 border-t border-neutral-200 pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(o.subtotal_cents)}</dd></div>
              {o.discount_total_cents > 0 && <div className="flex justify-between"><dt>Desconto {o.coupon_code_snapshot && `(${o.coupon_code_snapshot})`}</dt><dd>− {formatBRL(o.discount_total_cents)}</dd></div>}
              <div className="flex justify-between"><dt>Frete</dt><dd>{o.shipping_cents == null ? "A confirmar" : formatBRL(o.shipping_cents)}</dd></div>
              <div className="flex justify-between text-base font-extrabold"><dt>Total</dt><dd>{formatBRL(o.grand_total_cents)}</dd></div>
            </dl>
          </Panel>
          <Panel title="Cliente">
            <p className="text-sm">{o.customers?.name ?? "Não informado"}</p>
            {o.customers?.phone && <p className="text-sm"><a className="underline" href={`https://wa.me/${o.customers.phone.length <= 11 ? "55" + o.customers.phone : o.customers.phone}`} target="_blank" rel="noopener noreferrer">{o.customers.phone}</a></p>}
            {o.customers?.email && <p className="text-sm">{o.customers.email}</p>}
            {o.customer_notes && <p className="mt-2 rounded bg-mist p-2 text-sm"><strong>Observação do cliente:</strong> {o.customer_notes}</p>}
          </Panel>
          <Panel title="Observações internas">
            <ActionForm action={saveOrderNotesAction} submitLabel="Salvar observações"><input type="hidden" name="order_id" value={o.id} /><TextArea name="admin_notes" label="Visível apenas para a equipe" defaultValue={o.admin_notes ?? ""} rows={3} maxLength={2000} /></ActionForm>
          </Panel>
          <Panel title="Histórico de status">
            <ol className="space-y-2 text-sm">{(hist ?? []).map((h: any) => <li key={h.id} className="flex flex-wrap gap-x-2 border-l-4 border-brand pl-3"><span className="text-neutral-600">{dt(h.created_at)}</span><span>{h.previous_status ? `${ORDER_STATUS_LABEL[h.previous_status as OrderStatus]} → ` : ""}<strong>{ORDER_STATUS_LABEL[h.new_status as OrderStatus]}</strong></span>{h.note && <span className="text-neutral-700">— {h.note}</span>}</li>)}</ol>
          </Panel>
        </div>
        <div>
          <Receipt d={{ storeName: s.store_name, logoUrl: s.logo_url, orderNumber: o.order_number, createdAt: o.created_at, status, customerName: o.customers?.name ?? null, items,
            subtotalCents: o.subtotal_cents, discountCents: o.discount_total_cents, couponCode: o.coupon_code_snapshot, shippingCents: o.shipping_cents, totalCents: o.grand_total_cents, paymentReceivedAt: o.payment_received_at }} />
          <div className="mt-4 flex justify-center"><PrintButton /></div>
        </div>
      </div>
    </>
  );
}
