"use client";
import { Heart } from "lucide-react";
import { toggleFavorite, useFavorites } from "@/features/cart/favorites-store";
import { cn } from "@/lib/utils";

export function FavoriteButton({ productId, name, className }: { productId: string; name: string; className?: string }) {
  const favs = useFavorites();
  const on = favs.includes(productId);
  return (
    <button type="button" onClick={() => toggleFavorite(productId)} aria-pressed={on}
      aria-label={on ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`}
      className={cn("grid size-11 place-items-center rounded-full bg-white/95 text-ink shadow transition hover:scale-105", className)}>
      <Heart className={cn("size-5", on && "fill-brand text-brand")} aria-hidden />
    </button>
  );
}
