"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/features/cart/cart-store";
import { useFavorites } from "@/features/cart/favorites-store";
import { SafeImage } from "./safe-image";

interface Props { storeName: string; logoUrl: string | null; categories: { name: string; slug: string }[]; whatsappLink: string | null }

export function SiteHeader({ storeName, logoUrl, categories, whatsappLink }: Props) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
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

  const nav = [{ href: "/produtos", label: "Produtos" }, ...categories.slice(0, 5).map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })), { href: "/contato", label: "Contato" }];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-3">Ir para o conteúdo</a>
      <div className="container-x flex h-16 items-center gap-2 sm:gap-4">
        <button type="button" className="grid size-11 place-items-center lg:hidden" aria-label="Abrir menu" aria-expanded={open} aria-controls="menu-mobile" onClick={() => setOpen(true)}>
          <Menu className="size-6" aria-hidden />
        </button>
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-wide" aria-label={`${storeName} — página inicial`}>
          {logoUrl ? <span className="relative block h-9 w-32"><SafeImage src={logoUrl} alt={storeName} sizes="128px" className="object-contain object-left" priority /></span> : <span>{storeName}</span>}
        </Link>
        <nav aria-label="Principal" className="ml-6 hidden items-center gap-5 lg:flex">
          {nav.map((n) => <Link key={n.href} href={n.href} className="text-sm font-semibold hover:text-brand-strong hover:underline underline-offset-4">{n.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center">
          <form action="/busca" role="search" className={`${searching ? "absolute inset-x-0 top-0 z-10 flex h-16 items-center gap-2 bg-white px-4" : "hidden"} lg:static lg:flex lg:h-auto lg:bg-transparent lg:px-0`}>
            <label htmlFor="q-header" className="sr-only">Buscar produtos</label>
            <input id="q-header" name="q" type="search" placeholder="Buscar produtos" maxLength={80} className="field min-h-10 lg:w-56" />
            <button type="submit" className="grid size-11 shrink-0 place-items-center" aria-label="Buscar"><Search className="size-5" aria-hidden /></button>
            <button type="button" className="grid size-11 shrink-0 place-items-center lg:hidden" aria-label="Fechar busca" onClick={() => setSearching(false)}><X className="size-5" aria-hidden /></button>
          </form>
          <button type="button" className="grid size-11 place-items-center lg:hidden" aria-label="Abrir busca" onClick={() => setSearching(true)}><Search className="size-6" aria-hidden /></button>
          <Link href="/favoritos" className="relative grid size-11 place-items-center" aria-label={`Favoritos${hydrated && favs.length ? ` (${favs.length})` : ""}`}>
            <Heart className="size-6" aria-hidden />
          </Link>
          <Link href="/carrinho" className="relative grid size-11 place-items-center" aria-label={`Carrinho${hydrated ? `, ${count} ${count === 1 ? "item" : "itens"}` : ""}`}>
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
              {nav.concat(categories.slice(5).map((c) => ({ href: `/categoria/${c.slug}`, label: c.name }))).map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-white/10 py-4 font-display text-2xl font-bold uppercase">{n.label}</Link>
              ))}
              <Link href="/favoritos" onClick={() => setOpen(false)} className="border-b border-white/10 py-4 font-display text-2xl font-bold uppercase">Favoritos</Link>
            </nav>
            {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-auto"><MessageCircle className="size-5" aria-hidden />Falar no WhatsApp</a>}
          </div>
        </div>
      )}
    </header>
  );
}
