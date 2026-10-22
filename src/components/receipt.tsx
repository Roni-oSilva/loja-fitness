import { code39 } from "@/lib/barcode";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { SafeImage } from "./safe-image";
import type { OrderStatus } from "@/lib/types";

export interface ReceiptData {
  storeName: string; logoUrl: string | null; orderNumber: string; createdAt: string; status: OrderStatus; customerName: string | null;
  items: { name: string; size: string | null; color: string | null; quantity: number; lineTotalCents: number }[];
  subtotalCents: number; discountCents: number; couponCode: string | null; shippingCents: number | null; totalCents: number; paymentReceivedAt: string | null;
}

const fmtDate = (iso: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso)).toUpperCase();
const Row = ({ l, r, bold }: { l: string; r: string; bold?: boolean }) => <div className={`flex justify-between gap-3 ${bold ? "font-bold" : ""}`}><span>{l}</span><span className="shrink-0">{r}</span></div>;

/** Recibo do pedido (não é nota fiscal e não comprova pagamento, a menos que o pagamento tenha sido registrado pela loja). */
export function Receipt({ d }: { d: ReceiptData }) {
  const bc = code39(d.orderNumber);
  const qtd = d.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="mx-auto w-full max-w-sm">
      <article className="receipt print-area print-out px-6 pb-8 pt-8 text-[15px] leading-snug" aria-label={`Recibo do pedido ${d.orderNumber}`}>
        <h2 className="text-center text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-sans)", fontWeight: 800 }}>RECIBO</h2>
        <p className="mt-1 text-center uppercase">{d.storeName}</p>
        <div className="mt-6 uppercase">
          <p>Pedido #{d.orderNumber}{d.customerName ? ` para ${d.customerName}` : ""}</p>
          <p>{fmtDate(d.createdAt)}</p>
          <p>Situação: {ORDER_STATUS_LABEL[d.status]}</p>
        </div>
        <div className="dash mt-3" />
        <div className="flex justify-between py-1 uppercase"><span>Qtd&nbsp;&nbsp;Item</span><span>Valor</span></div>
        <div className="dash" />
        <ul className="space-y-2 py-2 uppercase">
          {d.items.map((i, k) => (
            <li key={k} className="flex justify-between gap-3">
              <span className="min-w-0"><span className="mr-3">{String(i.quantity).padStart(2, "0")}</span>{i.name}{(i.size || i.color) && <span className="block pl-8 text-[13px] opacity-75">{[i.size && `Tam ${i.size}`, i.color].filter(Boolean).join(" / ")}</span>}</span>
              <span className="shrink-0">{formatBRL(i.lineTotalCents)}</span>
            </li>))}
        </ul>
        <div className="dash" />
        <div className="space-y-0.5 py-2 uppercase">
          <Row l="Total de itens:" r={String(qtd)} />
          <Row l="Subtotal:" r={formatBRL(d.subtotalCents)} />
          {d.discountCents > 0 && <Row l={`Desconto${d.couponCode ? ` (${d.couponCode})` : ""}:`} r={`- ${formatBRL(d.discountCents)}`} />}
          <Row l="Frete:" r={d.shippingCents == null ? "A confirmar" : d.shippingCents === 0 ? "Grátis" : formatBRL(d.shippingCents)} />
          <Row l="Total:" r={formatBRL(d.totalCents)} bold />
        </div>
        <div className="dash" />
        <p className="py-2 uppercase">
          Pagamento: {d.paymentReceivedAt ? `confirmado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(d.paymentReceivedAt))}` : "a combinar no atendimento"}
        </p>
        <div className="dash" />
        <p className="mt-4 text-center uppercase tracking-wider">Obrigado pela preferência!</p>
        {bc && (
          <svg viewBox={`0 0 ${bc.width} 60`} preserveAspectRatio="none" className="mx-auto mt-4 h-16 w-full max-w-[16rem]" role="img" aria-label={`Código de barras do pedido ${d.orderNumber}`}>
            {bc.bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={60} fill="#111" />)}
          </svg>)}
        <p className="mt-1 text-center text-[13px] tracking-widest">{d.orderNumber}</p>
        <div className="mt-6 flex justify-center">
          {d.logoUrl ? <span className="relative block h-12 w-44"><SafeImage src={d.logoUrl} alt={d.storeName} sizes="176px" className="object-contain" /></span>
            : <span className="text-2xl font-extrabold uppercase" style={{ fontFamily: "var(--font-display)" }}>{d.storeName}</span>}
        </div>
      </article>
      <div className="receipt-edge" aria-hidden />
    </div>
  );
}
