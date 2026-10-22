"use client";
import { useSyncExternalStore } from "react";

/** Dados de exibição (snapshot) — o servidor sempre recalcula preço e estoque. */
export interface CartLine {
  variantId: string; slug: string; name: string; size: string | null; color: string | null;
  imageUrl: string | null; unitPriceCents: number; quantity: number;
}

const KEY = "lf_cart_v1";
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter((l): l is CartLine => l && typeof l.variantId === "string" && Number.isInteger(l.quantity) && l.quantity > 0 && l.quantity <= 99)
      : [];
  } catch { cache = []; }
  return cache;
}
function write(lines: CartLine[]) {
  cache = lines;
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* armazenamento indisponível: carrinho vale só nesta sessão */ }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; cb(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

export const cartActions = {
  add(line: CartLine, maxStock?: number) {
    const cur = read(); const i = cur.findIndex((l) => l.variantId === line.variantId);
    const cap = Math.min(99, maxStock ?? 99);
    if (i >= 0) write(cur.map((l, idx) => (idx === i ? { ...l, ...line, quantity: Math.min(cap, l.quantity + line.quantity) } : l)));
    else write([...cur, { ...line, quantity: Math.min(cap, line.quantity) }]);
  },
  setQuantity(variantId: string, quantity: number) {
    const q = Math.floor(quantity);
    if (!Number.isFinite(q) || q < 1) return;
    write(read().map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(q, 99) } : l)));
  },
  remove(variantId: string) { write(read().filter((l) => l.variantId !== variantId)); },
  clear() { write([]); },
  /** Atualiza o snapshot de exibição com os dados frescos do servidor. */
  sync(fresh: { variantId: string; unitPriceCents: number; name: string; imageUrl: string | null; quantity: number }[]) {
    const m = new Map(fresh.map((f) => [f.variantId, f]));
    const next = read().map((l) => { const f = m.get(l.variantId); return f ? { ...l, unitPriceCents: f.unitPriceCents, name: f.name, imageUrl: f.imageUrl, quantity: f.quantity } : l; });
    if (JSON.stringify(next) !== JSON.stringify(read())) write(next);
  },
};

export function useCart() {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  return { lines, hydrated, count: lines.reduce((s, l) => s + l.quantity, 0) };
}
