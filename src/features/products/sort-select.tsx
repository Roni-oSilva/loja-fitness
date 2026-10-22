"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-semibold">Ordenar</span>
      <select value={value} className="field min-h-10 w-auto" onChange={(e) => {
        const u = new URLSearchParams(sp.toString()); u.set("ordem", e.target.value); u.delete("pagina");
        router.push(`${path}?${u.toString()}`);
      }}>
        <option value="novidades">Novidades</option><option value="preco-asc">Menor preço</option>
        <option value="preco-desc">Maior preço</option><option value="nome">Nome (A–Z)</option>
      </select>
    </label>
  );
}
