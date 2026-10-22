import Link from "next/link";
import { MessageCircle, Mail } from "lucide-react";
import { SafeImage } from "./safe-image";
import type { StoreSettings } from "@/lib/types";

export function SiteFooter({ s, whatsappLink, categories }: { s: StoreSettings; whatsappLink: string | null; categories: { name: string; slug: string }[] }) {
  const social = [
    { href: s.instagram_url, label: "Instagram" }, { href: s.facebook_url, label: "Facebook" },
    { href: s.youtube_url, label: "YouTube" }, { href: s.tiktok_url, label: "TikTok" },
  ].filter((x) => x.href);
  const col = "space-y-2 text-sm text-white/80 [&_a:hover]:text-white [&_a:hover]:underline";
  return (
    <footer className="on-dark mt-20 rounded-t-[2.5rem] bg-ink text-white sm:rounded-t-[4rem]">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          {s.logo_url ? <span className="relative block size-32 overflow-hidden rounded-[2rem]"><SafeImage src={s.logo_url} alt={s.store_name} sizes="128px" className="object-cover" /></span> : <p className="font-display text-3xl font-extrabold">{s.store_name}</p>}
          {s.tagline && <p className="mt-3 max-w-xs text-sm text-white/80">{s.tagline}</p>}
          {social.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {social.map(({ href, label }) => (
                <li key={label}><a href={href as string} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-white/30 px-4 text-sm font-semibold hover:bg-white/10">{label}</a></li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Loja"><h2 className="mb-3 font-display text-lg font-bold text-brand">Loja</h2>
          <ul className={col}><li><Link href="/produtos">Todos os produtos</Link></li>
            {categories.slice(0, 6).map((c) => <li key={c.slug}><Link href={`/categoria/${c.slug}`}>{c.name}</Link></li>)}</ul></nav>
        <nav aria-label="Políticas"><h2 className="mb-3 font-display text-lg font-bold text-brand">Informações</h2>
          <ul className={col}>
            <li><Link href="/trocas-e-devolucoes">Trocas e devoluções</Link></li><li><Link href="/politica-de-gestao">Política de gestão</Link></li>
            <li><Link href="/politica-de-privacidade">Política de privacidade</Link></li>
            <li><Link href="/termos-de-uso">Termos de uso</Link></li><li><Link href="/contato">Contato</Link></li></ul></nav>
        <div><h2 className="mb-3 font-display text-lg font-bold text-brand">Atendimento</h2>
          <ul className={col}>
            {whatsappLink && <li><a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2"><MessageCircle className="size-4" aria-hidden />WhatsApp</a></li>}
            {s.contact_email && <li><a href={`mailto:${s.contact_email}`} className="inline-flex items-center gap-2"><Mail className="size-4" aria-hidden />{s.contact_email}</a></li>}
            {s.address && <li>{s.address}</li>}
            {s.delivery_info && <li className="pt-2 text-white/70">{s.delivery_info.slice(0, 160)}{s.delivery_info.length > 160 && "…"}</li>}
          </ul></div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">© {new Date().getFullYear()} {s.store_name}. Todos os direitos reservados.</div>
    </footer>
  );
}
