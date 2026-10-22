"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/features/cart/cart-store";
import { useFavorites } from "@/features/cart/favorites-store";
import { BrandMark } from "./brand-mark";

interface Props { storeName: string; logoUrl: string | null; categories: { name: string; slug: string }[]; whatsappLink: string | null }

/** Barra flutuante arredondada, uma única linha: menu à esquerda, marca SEMPRE centralizada, ações à direita. */
export function SiteHeader({ storeName, categories, whatsappLink }: Props) {
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
  const all = [{ href: "/produtos", label: "Todos os produtos" }, ...categories.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })), { href: "/favoritos", label: "Favoritos" }, { href: "/meus-pedidos", label: "Meus pedidos" }, { href: "/contato", label: "Contato" }];
  const icon = "relative grid size-11 place-items-center rounded-full transition hover:bg-white/10";

  return (
    <header className="on-dark sticky top-0 z-40 px-2 pt-2 sm:px-4 sm:pt-3">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-2xl focus:bg-white focus:p-3 focus:text-ink">Ir para o conteúdo</a>
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-full bg-ink/95 px-2 text-white shadow-[0_12px_30px_-12px_rgba(11,16,45,.6)] ring-1 ring-white/10 backdrop-blur sm:h-[4.5rem] sm:px-4">
        <div className="flex items-center gap-5">
          <button type="button" className={`${icon} lg:hidden`} aria-label="Abrir menu" aria-expanded={open} aria-controls="menu-mobile" onClick={() => setOpen(true)}><Menu className="size-6" aria-hidden /></button>
          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => <Link key={n.href} href={n.href} className="nav-link rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-white/10">{n.label}</Link>)}
          </nav>
        </div>

        <Link href="/" className="group flex max-w-[52vw] items-center justify-center gap-2 sm:max-w-none" aria-label={`${storeName} — página inicial`}>
          <BrandMark className="size-8 shrink-0 transition duration-500 group-hover:rotate-180 sm:size-10" />
          <span className="truncate font-display text-xl font-extrabold tracking-tight sm:text-3xl">{storeName}</span>
        </Link>

        <div className="flex items-center justify-end">
          <Link href="/busca" className={`${icon} hidden sm:grid`} aria-label="Buscar produtos"><Search className="size-5" aria-hidden /></Link>
          <Link href="/favoritos" className={`${icon} hidden sm:grid`} aria-label={`Favoritos${hydrated && favs.length ? ` (${favs.length})` : ""}`}><Heart className="size-5" aria-hidden /></Link>
          <Link href="/carrinho" className={`${icon} bg-brand !text-ink hover:!bg-accent`} aria-label={`Carrinho${hydrated ? `, ${count} ${count === 1 ? "item" : "itens"}` : ""}`}>
            <ShoppingBag className="size-5" aria-hidden />
            {hydrated && count > 0 && <span key={count} className="pop absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-extrabold text-ink ring-2 ring-ink">{count}</span>}
          </Link>
          {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm ml-2 hidden bg-white text-ink xl:inline-flex"><MessageCircle className="size-4" aria-hidden />WhatsApp</a>}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div ref={panel} id="menu-mobile" className="rise absolute inset-y-2 left-2 flex w-[86%] max-w-sm flex-col rounded-[2rem] bg-ink p-5 text-white">
            <div className="mb-4 flex items-center justify-between"><span className="flex items-center gap-2 font-display text-xl font-extrabold"><BrandMark className="size-8" />{storeName}</span>
              <button type="button" className="grid size-11 place-items-center rounded-full bg-white/10" aria-label="Fechar menu" onClick={() => setOpen(false)}><X className="size-6" aria-hidden /></button></div>
            <form action="/busca" role="search" className="mb-4 flex gap-2"><label htmlFor="q-menu" className="sr-only">Buscar produtos</label><input id="q-menu" name="q" type="search" maxLength={80} placeholder="Buscar produtos" className="field !border-white/20 !bg-white/10 !text-white placeholder:!text-white/70" /><button type="submit" className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-ink" aria-label="Buscar"><Search className="size-5" aria-hidden /></button></form>
            <nav aria-label="Menu mobile" className="flex flex-col gap-1 overflow-y-auto">
              {all.map((n, i) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} style={{ "--i": i } as React.CSSProperties} className="rise rounded-2xl px-4 py-3 font-display text-2xl font-bold transition hover:bg-white/10">{n.label}</Link>)}
            </nav>
            {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-auto"><MessageCircle className="size-5" aria-hidden />Falar no WhatsApp</a>}
          </div>
        </div>
      )}
    </header>
  );
}
