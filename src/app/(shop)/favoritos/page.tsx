import type { Metadata } from "next";
import { FavoritesView } from "@/features/products/favorites-view";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };
export default function Page() { return <FavoritesView />; }
