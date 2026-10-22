"use client";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { cartActions } from "./cart-store";

export function QuickAdd({ variantId, name, slug, imageUrl, priceCents }: { variantId: string; name: string; slug: string; imageUrl: string | null; priceCents: number }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn btn-primary btn-sm flex-1" aria-label={`Adicionar ${name} ao carrinho`}
      onClick={() => { cartActions.add({ variantId, name, slug, imageUrl, unitPriceCents: priceCents, size: null, color: null, quantity: 1 }); setDone(true); setTimeout(() => setDone(false), 1800); }}>
      {done ? <Check className="size-5" aria-hidden /> : <ShoppingBag className="size-5" aria-hidden />}
      <span aria-live="polite">{done ? "Adicionado" : "Comprar"}</span>
    </button>
  );
}
