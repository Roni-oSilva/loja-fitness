import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getOrderForAccess } from "@/lib/services/orders";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { formatBRL } from "@/lib/money";
import { OpenWhatsApp } from "@/features/orders/open-whatsapp";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string; abrir?: string }> }) {
  const [{ id }, { t, abrir }] = await Promise.all([params, searchParams]);
  // limita tentativas de adivinhar tokens/IDs
  const ip = ((await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
  if (!rateLimit(`order-view:${ip}`, 30, 60_000).ok) notFound();
  const o = await getOrderForAccess(id, t);
  if (!o) notFound();
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <p className="flex items-center gap-2 text-sm font-bold text-green-800"><CheckCircle2 className="size-5" aria-hidden />Pedido registrado</p>
      <h1 className="h-section mt-2">Pedido {o.orderNumber}</h1>
      <p className="mt-2 text-neutral-700">Situação: <strong>{ORDER_STATUS_LABEL[o.status]}</strong>. Seu pedido <strong>ainda não está pago nem confirmado</strong>: ele só segue após conversarmos pelo WhatsApp para confirmar disponibilidade, frete e pagamento.</p>
      <OpenWhatsApp link={o.whatsappLink} auto={abrir === "1"} orderId={o.id} />
      <section className="card mt-8 p-5" aria-label="Itens do pedido">
        <ul className="divide-y divide-neutral-200">
          {o.items.map((i, k) => <li key={k} className="flex justify-between gap-4 py-3 text-sm"><span>{i.quantity}× {i.name}{(i.size || i.color) && <span className="text-neutral-600"> ({[i.size && `Tam ${i.size}`, i.color].filter(Boolean).join(", ")})</span>}</span><span className="font-semibold">{formatBRL(i.lineTotalCents)}</span></li>)}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-neutral-200 pt-3 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(o.subtotalCents)}</dd></div>
          {o.discountCents > 0 && <div className="flex justify-between"><dt>Desconto{o.couponCode ? ` (${o.couponCode})` : ""}</dt><dd>− {formatBRL(o.discountCents)}</dd></div>}
          <div className="flex justify-between"><dt>Frete</dt><dd>{o.shippingCents == null ? "A confirmar" : o.shippingCents === 0 ? "Grátis" : formatBRL(o.shippingCents)}</dd></div>
          <div className="flex justify-between text-lg font-extrabold"><dt>Total estimado</dt><dd>{formatBRL(o.totalCents)}</dd></div>
        </dl>
      </section>
      <p className="mt-4 text-xs text-neutral-600">Guarde esta página: o endereço contém seu acesso privado ao pedido. Não o compartilhe.</p>
    </div>
  );
}
