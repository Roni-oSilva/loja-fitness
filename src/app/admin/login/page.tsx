import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getStaff } from "@/lib/auth";
import { publicEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getStaff()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <p className="eyebrow">Painel administrativo</p>
        <h1 className="mt-1 font-display text-4xl font-extrabold uppercase">Entrar</h1>
        {!publicEnv().configured && <p role="alert" className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">Supabase não configurado: defina as variáveis de ambiente (ver README).</p>}
        <LoginForm next={next} />
      </div>
    </main>
  );
}
