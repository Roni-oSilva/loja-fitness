"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Loader2, MessageCircle, Minus, Plus, Trash2 } from "lucide-react";
import { cartActions, useCart } from "./cart-store";
import { checkoutAction, quoteCartAction } from "./actions";
import type { Quote, QuoteLine } from "@/lib/services/orders";
import { SafeImage } from "@/components/safe-image";
import { EmptyState } from "@/components/empty-state";
import { BackButton } from "@/components/back-button";
import { formatBRL } from "@/lib/money";

const PROBLEM: Record<NonNullable<QuoteLine["problem"]>, string> = {
  unavailable: "Este produto não está mais disponível.",
  out_of_stock: "Sem estoque no momento.",
  insufficient_stock: "Quantidade acima do estoque disponível.",
};

export function CartView({ whatsappReady, freeShippingHint }: { whatsappReady: boolean; freeShippingHint: string | null }) {
  const router = useRouter();
  const { lines, hydrated } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", consent: false, website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const idem = useRef<string>("");
  const [confirmClear, setConfirmClear] = useState(false);

  const key = lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
  const refresh = useCallback(async (code?: string) => {
    if (!lines.length) { setQuote(null); return; }
    setLoading(true); setLoadError(null);
    const res = await quoteCartAction({ items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), couponCode: code ?? "" }).catch(() => null);
    setLoading(false);
    if (!res) { setLoadError("Sem conexão. Mostrando os últimos valores conhecidos."); return; }
    if (!res.ok) { setLoadError(res.message); return; }
    setQuote(res.quote);
    const changed = res.quote.lines.filter((q) => { const l = lines.find((x) => x.variantId === q.variantId); return l && !q.problem && l.unitPriceCents !== q.unitPriceCents; });
    if (changed.length) setNotice(`Preços atualizados: ${changed.map((c) => c.name).join(", ")}.`);
    cartActions.sync(res.quote.lines.filter((q) => !q.problem || q.problem === "insufficient_stock").map((q) => ({ variantId: q.variantId, unitPriceCents: q.unitPriceCents, name: q.name, imageUrl: q.imageUrl, quantity: q.quantity })));
  }, [lines]);

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { if (hydrated) void refresh(couponApplied); }, [hydrated, key, couponApplied]);
  useEffect(() => { if (!idem.current) idem.current = crypto.randomUUID() + crypto.randomUUID().slice(0, 8); }, []);

  if (!hydrated) return <div className="container-x py-12" role="status" aria-label="Carregando carrinho"><div className="skeleton h-12 w-64" /><div className="skeleton mt-8 h-40" /></div>;
  if (!lines.length) return <div className="container-x py-12"><h1 className="h-section mb-8">Carrinho</h1><EmptyState title="Seu carrinho está vazio" text="Escolha seus produtos e finalize pelo WhatsApp." href="/produtos" cta="Ver produtos" /></div>;

  const view = (l: (typeof lines)[number]) => quote?.lines.find((q) => q.variantId === l.variantId);
  const totals = quote?.totals;
  const blocked = !quote || quote.hasBlockingProblem || loading;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setSubmitError(null); setErrors({});
    startTransition(async () => {
      const res = await checkoutAction({ items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), couponCode: couponApplied ?? "", idempotencyKey: idem.current,
        name: form.name, phone: form.phone, email: form.email, notes: form.notes, consent: form.consent, website: form.website, expectedTotalCents: quote?.totals.grandTotalCents }).catch(() => null);
      if (!res) { setSubmitError("Falha de conexão. Seu pedido NÃO foi enviado — tente novamente."); return; }
      if (!res.ok) {
        setSubmitError(res.message); if (res.fieldErrors) setErrors(res.fieldErrors); if (res.quote) setQuote(res.quote);
        return;
      }
      cartActions.clear();
      router.push(res.redirectTo);
    });
  }

  return (
    <div className="container-x py-8 sm:py-12">
      <div className="mb-4"><BackButton fallback="/produtos" label="Continuar comprando" /></div>
      <div className="flex items-end justify-between gap-4"><h1 className="h-section">Carrinho</h1>
        {confirmClear ? <span className="flex items-center gap-2 text-sm">Esvaziar?<button type="button" className="btn btn-dark btn-sm" onClick={() => { cartActions.clear(); setConfirmClear(false); }}>Sim</button><button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmClear(false)}>Não</button></span>
          : <button type="button" className="text-sm font-semibold underline" onClick={() => setConfirmClear(true)}>Esvaziar carrinho</button>}</div>
      {notice && <p role="status" className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{notice}</p>}
      {loadError && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">{loadError} <button type="button" className="underline" onClick={() => refresh(couponApplied)}>Tentar de novo</button></p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {lines.map((l) => {
            const q = view(l); const unit = q?.unitPriceCents ?? l.unitPriceCents; const maxQty = q && q.stock > 0 ? Math.min(q.stock, 99) : 99;
            return (
              <li key={l.variantId} className="flex gap-4 py-5">
                <Link href={`/produto/${l.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-mist sm:size-28">{l.imageUrl && <SafeImage src={l.imageUrl} alt="" sizes="112px" className="object-cover" />}</Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/produto/${l.slug}`} className="font-semibold hover:underline">{q?.name ?? l.name}</Link>
                  <p className="text-sm text-neutral-600">{[l.size && `Tam ${l.size}`, l.color].filter(Boolean).join(" · ")}</p>
                  {q?.problem && <p role="alert" className="mt-1 flex items-center gap-1 text-sm font-bold text-red-700"><AlertTriangle className="size-4" aria-hidden />{PROBLEM[q.problem]}{q.problem === "insufficient_stock" && ` Disponível: ${q.stock}.`}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center rounded-2xl border-2 border-neutral-300" role="group" aria-label={`Quantidade de ${l.name}`}>
                      <button type="button" className="grid size-11 place-items-center disabled:opacity-40" aria-label="Diminuir" disabled={l.quantity <= 1} onClick={() => cartActions.setQuantity(l.variantId, l.quantity - 1)}><Minus className="size-4" aria-hidden /></button>
                      <output className="w-9 text-center font-bold">{l.quantity}</output>
                      <button type="button" className="grid size-11 place-items-center disabled:opacity-40" aria-label="Aumentar" disabled={l.quantity >= maxQty} onClick={() => cartActions.setQuantity(l.variantId, l.quantity + 1)}><Plus className="size-4" aria-hidden /></button>
                    </div>
                    <p className="text-right"><span className="font-extrabold">{formatBRL(unit * l.quantity)}</span>{l.quantity > 1 && <span className="block text-xs text-neutral-600">{formatBRL(unit)} cada</span>}</p>
                    <button type="button" className="grid size-11 place-items-center text-neutral-700 hover:text-red-700" aria-label={`Remover ${l.name}`} onClick={() => cartActions.remove(l.variantId)}><Trash2 className="size-5" aria-hidden /></button>
                  </div>
                </div>
              </li>);
          })}
        </ul>

        <aside className="card h-fit p-5 lg:sticky lg:top-24" aria-label="Resumo do pedido">
          <h2 className="font-display text-2xl font-extrabold uppercase">Resumo</h2>
          <div className="mt-4 flex gap-2">
            <label htmlFor="cupom" className="sr-only">Cupom</label>
            <input id="cupom" className="field min-h-11 uppercase" placeholder="Cupom" value={coupon} maxLength={32} onChange={(e) => setCoupon(e.target.value)} />
            <button type="button" className="btn btn-outline btn-sm" disabled={!coupon.trim() || loading} onClick={() => { setCouponApplied(coupon.trim().toUpperCase()); }}>Aplicar</button>
          </div>
          {quote?.couponMessage && <p role="status" className={`mt-2 text-sm font-semibold ${quote.couponId ? "text-green-800" : "text-red-700"}`}>{quote.couponMessage}</p>}
          {couponApplied && <button type="button" className="mt-1 text-sm underline" onClick={() => { setCouponApplied(undefined); setCoupon(""); }}>Remover cupom</button>}
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{totals ? formatBRL(totals.subtotalCents) : "—"}</dd></div>
            {!!totals?.discountCents && <div className="flex justify-between text-green-800"><dt>Desconto ({quote?.couponCode})</dt><dd className="font-semibold">− {formatBRL(totals.discountCents)}</dd></div>}
            <div className="flex justify-between"><dt>Frete</dt><dd className="font-semibold">{totals ? (totals.shippingCents === 0 ? "Grátis" : "A confirmar no WhatsApp") : "—"}</dd></div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-lg"><dt className="font-bold">Total estimado</dt><dd className="font-extrabold">{totals ? formatBRL(totals.grandTotalCents) : "—"}</dd></div>
          </dl>
          {freeShippingHint && <p className="mt-2 text-xs text-neutral-600">{freeShippingHint}</p>}
          <p className="mt-2 text-xs text-neutral-600">Valores conferidos pela loja. Frete, disponibilidade final e pagamento são combinados no atendimento.</p>

          <form onSubmit={submit} className="mt-5 space-y-3 border-t border-neutral-200 pt-5" noValidate>
            <h3 className="font-display text-xl font-bold uppercase">Seus dados</h3>
            <div><label htmlFor="c-name" className="label">Nome *</label><input id="c-name" className="field" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? "e-name" : undefined} />{errors.name && <p id="e-name" className="mt-1 text-sm text-red-700">{errors.name}</p>}</div>
            <div><label htmlFor="c-phone" className="label">WhatsApp / telefone (opcional)</label><input id="c-phone" className="field" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-8888" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-invalid={!!errors.phone} />{errors.phone && <p className="mt-1 text-sm text-red-700">{errors.phone}</p>}</div>
            <div><label htmlFor="c-notes" className="label">Observações (opcional)</label><textarea id="c-notes" className="field" rows={2} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <label className="flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[--brand]" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
              <span>Concordo em usar meu nome{form.phone ? " e telefone" : ""} para atender este pedido, conforme a <Link href="/politica-de-privacidade" className="underline" target="_blank">Política de Privacidade</Link>.</span></label>
            {errors.consent && <p className="text-sm text-red-700">{errors.consent}</p>}
            {submitError && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">{submitError}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={blocked || pending || !whatsappReady} aria-busy={pending}>
              {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <MessageCircle className="size-5" aria-hidden />}{pending ? "Registrando pedido…" : "Finalizar pelo WhatsApp"}
            </button>
            {!whatsappReady && <p className="text-xs text-red-700">O WhatsApp da loja ainda não foi configurado; não é possível finalizar.</p>}
            {quote?.hasBlockingProblem && <p className="text-xs text-red-700">Corrija os itens indisponíveis para continuar.</p>}
          </form>
        </aside>
      </div>
    </div>
  );
}
