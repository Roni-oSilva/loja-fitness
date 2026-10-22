import type { Metadata } from "next";
import { CartView } from "@/features/cart/cart-view";
import { getStoreSettings } from "@/lib/services/catalog";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false } };

export default async function Page() {
  const s = await getStoreSettings();
  const hint = s.free_shipping_threshold_cents ? `Frete grátis em pedidos a partir de ${formatBRL(s.free_shipping_threshold_cents)} (após descontos).` : null;
  return <CartView whatsappReady={!!s.whatsapp_number} freeShippingHint={hint} />;
}
