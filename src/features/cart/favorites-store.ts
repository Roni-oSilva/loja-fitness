"use client";
import { useSyncExternalStore } from "react";

const KEY = "lf_favs_v1";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try { const p = JSON.parse(localStorage.getItem(KEY) ?? "[]"); cache = Array.isArray(p) ? p.filter((x) => typeof x === "string").slice(0, 200) : []; } catch { cache = []; }
  return cache;
}
function write(v: string[]) { cache = v; try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* sem persistência */ } listeners.forEach((l) => l()); }
function subscribe(cb: () => void) {
  listeners.add(cb);
  const h = (e: StorageEvent) => { if (e.key === KEY) { cache = null; cb(); } };
  window.addEventListener("storage", h);
  return () => { listeners.delete(cb); window.removeEventListener("storage", h); };
}
export const toggleFavorite = (id: string) => { const c = read(); write(c.includes(id) ? c.filter((x) => x !== id) : [...c, id]); };
export const useFavorites = () => useSyncExternalStore(subscribe, read, () => EMPTY);
