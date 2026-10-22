import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Truck } from "lucide-react";
import { getStoreSettings } from "@/lib/services/catalog";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { EmptyState } from "@/components/empty-state";

export const revalidate = 300;
export const metadata: Metadata = { title: "Contato", alternates: { canonical: "/contato" } };

export default async function Page() {
  const s = await getStoreSettings();
  const wa = s.whatsapp_number ? buildWhatsAppLink(s.whatsapp_number, `Olá! Vim pelo site da ${s.store_name}.`) : null;
  const none = !wa && !s.contact_email && !s.address;
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <h1 className="h-section">Contato</h1>
      <p className="mt-2 text-neutral-700">Fale com a gente para tirar dúvidas, confirmar um pedido ou combinar a entrega.</p>
      {none ? <div className="mt-8"><EmptyState title="Canais em configuração" text="Os canais de atendimento ainda não foram cadastrados." /></div> : (
        <ul className="mt-8 space-y-4">
          {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><MessageCircle className="size-5" aria-hidden />Chamar no WhatsApp</a></li>}
          {s.contact_email && <li className="flex items-center gap-3"><Mail className="size-5" aria-hidden /><a className="underline" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>}
          {s.address && <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-5" aria-hidden />{s.address}</li>}
          {s.delivery_info && <li className="flex items-start gap-3"><Truck className="mt-0.5 size-5 shrink-0" aria-hidden /><span className="whitespace-pre-line">{s.delivery_info}</span></li>}
        </ul>)}
    </div>
  );
}
