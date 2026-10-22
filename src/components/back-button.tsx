"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Volta para a página anterior do site; sem histórico (link direto), vai para o fallback. */
export function BackButton({ fallback = "/produtos", label = "Voltar" }: { fallback?: string; label?: string }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => { if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back(); else router.push(fallback); }}
      className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-mist px-4 py-2 text-sm font-bold transition hover:-translate-x-0.5 hover:bg-accent">
      <ArrowLeft className="size-4 transition group-hover:-translate-x-1" aria-hidden />{label}
    </button>
  );
}
