"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { safeInternalPath } from "@/lib/utils";
import type { FormState } from "@/features/admin/form-utils";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(200), next: z.string().optional() });

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = schema.safeParse({ email: form.get("email"), password: form.get("password"), next: form.get("next") ?? undefined });
  if (!parsed.success) return { ok: false, message: "Informe e-mail e senha válidos." };
  const { email, password } = parsed.data;
  const ip = ((await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
  if (!rateLimit(`login:${ip}:${email}`, 5, 15 * 60_000).ok || !rateLimit(`login-ip:${ip}`, 30, 15 * 60_000).ok)
    return { ok: false, message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };

  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "O Supabase ainda não foi configurado (veja o README)." };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, message: "E-mail ou senha incorretos." }; // mensagem única: não revela se o e-mail existe
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!profile) { await supabase.auth.signOut(); return { ok: false, message: "Esta conta não tem acesso ao painel." }; }
  const next = safeInternalPath(parsed.data.next, "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}
