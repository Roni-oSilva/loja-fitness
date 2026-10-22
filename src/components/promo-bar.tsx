import Link from "next/link";
import type { StoreSettings } from "@/lib/types";
import { formatBRL } from "@/lib/money";

/** Só exibe o que está configurado; o aviso de frete grátis vem do limite real cadastrado. */
export function PromoBar({ s }: { s: StoreSettings }) {
  if (!s.promo_bar_enabled || !s.promo_bar_text) return null;
  const text = s.promo_bar_text.replace("{frete_gratis}", s.free_shipping_threshold_cents ? formatBRL(s.free_shipping_threshold_cents) : "");
  const inner = <span className="font-display text-base font-bold uppercase tracking-wide">{text}</span>;
  return (
    <div className="bg-accent text-center text-ink">
      <div className="container-x py-2">{s.promo_bar_link ? <Link href={s.promo_bar_link} className="underline-offset-4 hover:underline">{inner}</Link> : inner}</div>
    </div>
  );
}
