import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getOrderForAccess } from "@/lib/services/orders";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { Receipt } from "@/components/receipt";
import { PrintButton } from "@/features/orders/print-button";
import { Confetti } from "@/components/animated";
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
      {abrir === "1" && <Confetti />}
      <p className="flex items-center gap-2 text-sm font-bold text-green-800"><CheckCircle2 className="size-5" aria-hidden />Pedido registrado</p>
      <h1 className="h-section mt-2">Pedido {o.orderNumber}</h1>
      <p className="mt-2 text-neutral-700">Situação: <strong>{ORDER_STATUS_LABEL[o.status]}</strong>. Seu pedido <strong>ainda não está pago nem confirmado</strong>: ele só segue após conversarmos pelo WhatsApp para confirmar disponibilidade, frete e pagamento.</p>
      <OpenWhatsApp link={o.whatsappLink} auto={abrir === "1"} orderId={o.id} />
      <div className="mt-10">
        <Receipt d={{ storeName: o.storeName, logoUrl: o.logoUrl, orderNumber: o.orderNumber, createdAt: o.createdAt, status: o.status, customerName: o.customerName, items: o.items,
          subtotalCents: o.subtotalCents, discountCents: o.discountCents, couponCode: o.couponCode, shippingCents: o.shippingCents, totalCents: o.totalCents, paymentReceivedAt: o.paymentReceivedAt }} />
        <div className="mt-5 flex justify-center"><PrintButton /></div>
      </div>
      <p className="mt-4 text-xs text-neutral-600">Guarde esta página: o endereço contém seu acesso privado ao pedido. Não o compartilhe.</p>
    </div>
  );
}
