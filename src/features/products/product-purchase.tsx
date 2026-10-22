"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Minus, MessageCircle, Plus, ShoppingBag } from "lucide-react";
import { cartActions } from "@/features/cart/cart-store";
import { FavoriteButton } from "@/components/favorite-button";
import { formatBRL } from "@/lib/money";
import { clampQuantity } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export interface PurchaseVariant { id: string; size: string | null; color: string | null; stock: number; priceCents: number; sku: string | null }
interface Props {
  productId: string; name: string; slug: string; imageUrl: string | null; variants: PurchaseVariant[];
  sizes: string[]; colors: string[]; compareAtCents: number | null; lowStockThreshold: number; whatsappEnabled: boolean;
}

export function ProductPurchase({ productId, name, slug, imageUrl, variants, sizes, colors, compareAtCents, lowStockThreshold, whatsappEnabled }: Props) {
  const router = useRouter();
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? (sizes[0] as string) : null);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? (colors[0] as string) : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const variant = useMemo(() => variants.find((v) => (v.size ?? null) === size && (v.color ?? null) === color) ?? null, [variants, size, color]);
  const needsSize = sizes.length > 0 && size == null, needsColor = colors.length > 0 && color == null;
  const prices = variants.map((v) => v.priceCents);
  const shown = variant?.priceCents ?? Math.min(...prices);
  const range = !variant && Math.min(...prices) !== Math.max(...prices);
  const stock = variant?.stock ?? 0;

  const sizeState = (s: string) => {
    const match = variants.filter((v) => v.size === s && (color == null || v.color === color));
    return match.length === 0 ? "none" : match.some((v) => v.stock > 0) ? "ok" : "soldout";
  };
  const colorState = (c: string) => {
    const match = variants.filter((v) => v.color === c && (size == null || v.size === size));
    return match.length === 0 ? "none" : match.some((v) => v.stock > 0) ? "ok" : "soldout";
  };
  const anyStock = variants.some((v) => v.stock > 0);

  function add(): boolean {
    setError(null);
    if (needsSize || needsColor) { setError(`Selecione ${needsSize && needsColor ? "o tamanho e a cor" : needsSize ? "o tamanho" : "a cor"} para continuar.`); return false; }
    if (!variant) { setError("Esta combinação não está disponível. Escolha outra opção."); return false; }
    if (variant.stock <= 0) { setError("Esta opção está esgotada."); return false; }
    const q = clampQuantity(qty, variant.stock);
    cartActions.add({ variantId: variant.id, slug, name, size: variant.size, color: variant.color, imageUrl, unitPriceCents: variant.priceCents, quantity: q }, variant.stock);
    setAdded(true); setTimeout(() => setAdded(false), 4000);
    return true;
  }

  const Opt = ({ label, state, selected, onClick }: { label: string; state: string; selected: boolean; onClick: () => void }) => (
    <button type="button" role="radio" aria-checked={selected} disabled={state === "none"} onClick={onClick}
      className={cn("min-h-11 min-w-12 rounded-2xl border-2 px-3 text-sm font-bold transition", selected ? "border-ink bg-ink text-white" : "border-neutral-300 bg-white hover:border-ink",
        state === "soldout" && !selected && "text-neutral-500 line-through", state === "none" && "cursor-not-allowed opacity-30")}>
      {label}{state === "soldout" && <span className="sr-only"> (esgotado)</span>}
    </button>
  );

  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-3xl font-extrabold">{range && <span className="text-base font-semibold">a partir de </span>}{formatBRL(shown)}</span>
        {compareAtCents && compareAtCents > shown && <span className="text-lg text-neutral-600 line-through"><span className="sr-only">De </span>{formatBRL(compareAtCents)}</span>}
      </p>

      {sizes.length > 0 && (
        <div className="mt-6" role="radiogroup" aria-label="Tamanho">
          <p className="label">Tamanho{size && <span className="font-normal">: {size}</span>}</p>
          <div className="flex flex-wrap gap-2">{sizes.map((s) => <Opt key={s} label={s} state={sizeState(s)} selected={size === s} onClick={() => { setSize(size === s ? null : s); setError(null); }} />)}</div>
        </div>
      )}
      {colors.length > 0 && (
        <div className="mt-5" role="radiogroup" aria-label="Cor">
          <p className="label">Cor{color && <span className="font-normal">: {color}</span>}</p>
          <div className="flex flex-wrap gap-2">{colors.map((c) => <Opt key={c} label={c} state={colorState(c)} selected={color === c} onClick={() => { setColor(color === c ? null : c); setError(null); }} />)}</div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center rounded-2xl border-2 border-neutral-300" role="group" aria-label="Quantidade">
          <button type="button" className="grid size-11 place-items-center disabled:opacity-40" aria-label="Diminuir quantidade" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="size-4" aria-hidden /></button>
          <output className="w-10 text-center font-bold" aria-live="polite">{qty}</output>
          <button type="button" className="grid size-11 place-items-center disabled:opacity-40" aria-label="Aumentar quantidade" disabled={!!variant && qty >= Math.min(stock, 99)} onClick={() => setQty((q) => clampQuantity(q + 1, variant ? variant.stock : 99))}><Plus className="size-4" aria-hidden /></button>
        </div>
        <p className="text-sm" aria-live="polite">
          {!anyStock ? <span className="font-bold text-neutral-700">Produto indisponível</span>
            : !variant ? <span className="text-neutral-600">Selecione as opções</span>
            : stock <= 0 ? <span className="font-bold text-brand-strong">Opção esgotada</span>
            : stock <= lowStockThreshold ? <span className="font-bold text-brand-strong">Restam {stock} {stock === 1 ? "unidade" : "unidades"}</span>
            : <span className="font-semibold text-green-800">Em estoque</span>}
          {variant?.sku && <span className="ml-2 text-neutral-500">SKU {variant.sku}</span>}
        </p>
      </div>

      {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" className="btn btn-primary" disabled={!anyStock} onClick={add}>
          {added ? <Check className="size-5" aria-hidden /> : <ShoppingBag className="size-5" aria-hidden />}{added ? "Adicionado" : "Adicionar ao carrinho"}
        </button>
        <button type="button" className="btn btn-dark" disabled={!anyStock || !whatsappEnabled} onClick={() => { if (add()) router.push("/carrinho"); }}
          title={whatsappEnabled ? undefined : "O WhatsApp da loja ainda não foi configurado"}>
          <MessageCircle className="size-5" aria-hidden />Continuar no WhatsApp
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        {added ? <p role="status" className="text-sm font-semibold">Item no carrinho. <Link href="/carrinho" className="underline">Ver carrinho</Link></p> : <span />}
        <span className="flex items-center gap-2 text-sm">Favoritar <FavoriteButton productId={productId} name={name} className="border border-neutral-300" /></span>
      </div>
    </div>
  );
}
