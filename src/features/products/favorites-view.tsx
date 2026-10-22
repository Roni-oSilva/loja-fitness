"use client";
import { useEffect, useState } from "react";
import { useFavorites } from "@/features/cart/favorites-store";
import { getProductsByIdsAction } from "./actions";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import type { ProductCardData } from "@/lib/catalog-filter";

export function FavoritesView() {
  const ids = useFavorites();
  const [items, setItems] = useState<ProductCardData[] | null>(null);
  const [error, setError] = useState(false);
  const key = ids.join(",");
  useEffect(() => {
    let live = true;
    if (!ids.length) { setItems([]); return; }
    getProductsByIdsAction(ids).then((r) => { if (live) { setItems(r); setError(false); } }).catch(() => live && setError(true));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="h-section mb-8">Favoritos</h1>
      {error ? <p role="alert" className="rounded-md bg-red-50 p-3 font-semibold text-red-800">Não foi possível carregar seus favoritos. Tente novamente.</p>
        : items === null ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" role="status" aria-label="Carregando">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton aspect-[4/5]" />)}</div>
        : items.length ? <ProductGrid items={items} />
        : <EmptyState title="Nenhum favorito ainda" text="Toque no coração de um produto para salvá-lo aqui. Seus favoritos ficam neste aparelho." href="/produtos" cta="Ver produtos" />}
    </div>
  );
}
