"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/features/cart/cart-store";
import { useFavorites } from "@/features/cart/favorites-store";
import { SafeImage } from "./safe-image";

interface Props { storeName: string; logoUrl: string | null; categories: { name: string; slug: string }[]; whatsappLink: string | null }

/** Uma única linha: menu à esquerda, marca SEMPRE centralizada, ações à direita. */
export function SiteHeader({ storeName, logoUrl, categories, whatsappLink }: Props) {
  const [open, setOpen] = useState(false);
  const { count, hydrated } = useCart();
  const favs = useFavorites();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const nav = [{ href: "/produtos", label: "Produtos" }, ...categories.slice(0, 2).map((c) => ({ href: `/categoria/${c.slug}`, label: c.name }))];
  const all = [{ href: "/produtos", label: "Todos os produtos" }, ...categories.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })), { href: "/favoritos", label: "Favoritos" }, { href: "/contato", label: "Contato" }];
  const icon = "relative grid size-11 place-items-center";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-3">Ir para o conteúdo</a>
      <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 sm:h-20">
        <div className="flex items-center gap-5">
          <button type="button" className={`${icon} lg:hidden`} aria-label="Abrir menu" aria-expanded={open} aria-controls="menu-mobile" onClick={() => setOpen(true)}><Menu className="size-6" aria-hidden /></button>
          <nav aria-label="Principal" className="hidden items-center gap-6 lg:flex">
            {nav.map((n) => <Link key={n.href} href={n.href} className="text-sm font-medium underline-offset-4 hover:underline">{n.label}</Link>)}
          </nav>
        </div>

        <Link href="/" className="flex justify-center font-display text-3xl font-extrabold uppercase tracking-wide sm:text-4xl" aria-label={`${storeName} — página inicial`}>
          {logoUrl ? <span className="relative block h-9 w-36 sm:h-11 sm:w-44"><SafeImage src={logoUrl} alt={storeName} sizes="176px" className="object-contain" priority /></span> : <span className="truncate">{storeName}</span>}
        </Link>

        <div className="flex items-center justify-end">
          <Link href="/busca" className={icon} aria-label="Buscar produtos"><Search className="size-6" aria-hidden /></Link>
          <Link href="/favoritos" className={`${icon} hidden sm:grid`} aria-label={`Favoritos${hydrated && favs.length ? ` (${favs.length})` : ""}`}><Heart className="size-6" aria-hidden /></Link>
          <Link href="/carrinho" className={icon} aria-label={`Carrinho${hydrated ? `, ${count} ${count === 1 ? "item" : "itens"}` : ""}`}>
            <ShoppingBag className="size-6" aria-hidden />
            {hydrated && count > 0 && <span className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-extrabold text-ink">{count}</span>}
          </Link>
          {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm ml-2 hidden xl:inline-flex"><MessageCircle className="size-5" aria-hidden />WhatsApp</a>}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <div ref={panel} id="menu-mobile" className="on-dark absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-ink p-5 text-white">
            <button type="button" className="mb-4 ml-auto grid size-11 place-items-center" aria-label="Fechar menu" onClick={() => setOpen(false)}><X className="size-6" aria-hidden /></button>
            <nav aria-label="Menu mobile" className="flex flex-col overflow-y-auto">
              {all.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-white/10 py-4 font-display text-2xl font-bold uppercase">{n.label}</Link>)}
            </nav>
            {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-auto"><MessageCircle className="size-5" aria-hidden />Falar no WhatsApp</a>}
          </div>
        </div>
      )}
    </header>
  );
}
