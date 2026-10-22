"use client";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

/** Tenta abrir o WhatsApp uma única vez; o botão permanece como alternativa se o navegador bloquear. O pedido já está salvo. */
export function OpenWhatsApp({ link, auto, orderId }: { link: string | null; auto: boolean; orderId: string }) {
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (!auto || !link) return;
    const key = `lf_wa_${orderId}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* segue */ }
    const t = setTimeout(() => { setTried(true); window.location.assign(link); }, 900);
    return () => clearTimeout(t);
  }, [auto, link, orderId]);

  if (!link) return <p role="alert" className="mt-6 rounded-md bg-amber-50 p-4 text-sm font-semibold text-amber-900">O WhatsApp da loja não está configurado. Seu pedido foi salvo; entre em contato com a loja informando o número do pedido.</p>;
  return (
    <div className="mt-6 rounded-xl bg-ink p-5 text-white on-dark">
      <p className="font-semibold" aria-live="polite">{auto && !tried ? "Abrindo o WhatsApp…" : "Continue a conversa com a loja:"}</p>
      <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-3 w-full sm:w-auto"><MessageCircle className="size-5" aria-hidden />Abrir WhatsApp com meu pedido</a>
      <p className="mt-3 text-sm text-white/80">Se nada abrir, toque no botão acima. A mensagem já vai preenchida, basta enviar.</p>
    </div>
  );
}
