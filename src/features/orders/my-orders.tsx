"use client";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

const KEY = "lf_orders_v1";
export interface SavedOrder { id: string; token: string; number: string; at: string }
const EMPTY: SavedOrder[] = [];
let cache: SavedOrder[] | null = null;
const listeners = new Set<() => void>();
function read(): SavedOrder[] {
  if (cache) return cache;
  try { const p = JSON.parse(localStorage.getItem(KEY) ?? "[]"); cache = Array.isArray(p) ? p.filter((o) => o && typeof o.id === "string" && typeof o.token === "string").slice(0, 50) : []; } catch { cache = []; }
  return cache;
}
function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
export function saveOrder(o: SavedOrder) {
  const cur = read().filter((x) => x.id !== o.id);
  cache = [o, ...cur].slice(0, 50);
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* sem persistência */ }
  listeners.forEach((l) => l());
}

/** Guarda o acesso ao pedido NESTE aparelho para o cliente rever o recibo depois. */
export function RememberOrder({ id, token, number }: { id: string; token: string; number: string }) {
  useEffect(() => { saveOrder({ id, token, number, at: new Date().toISOString() }); }, [id, token, number]);
  return null;
}

export function MyOrders() {
  const orders = useSyncExternalStore(subscribe, read, () => EMPTY);
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <h1 className="h-section">Meus pedidos</h1>
      <p className="mt-2 text-neutral-700">Os pedidos feitos neste aparelho ficam aqui, com o recibo de cada um.</p>
      <div className="mt-8">
        {orders.length === 0 ? <EmptyState title="Nenhum pedido neste aparelho" text="Quando você finalizar um pedido, o recibo ficará guardado aqui." href="/produtos" cta="Ver produtos" /> : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/pedido/${o.id}?t=${encodeURIComponent(o.token)}`} className="lift flex items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand"><ReceiptText className="size-6" aria-hidden /></span>
                  <span className="flex-1"><b className="font-display text-lg">{o.number}</b><span className="block text-sm text-neutral-600">{new Date(o.at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span></span>
                  <span className="btn btn-outline btn-sm">Ver recibo</span>
                </Link>
              </li>))}
          </ul>)}
      </div>
    </div>
  );
}
