"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction } from "./actions";
import type { FormState } from "@/features/admin/form-utils";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div><label htmlFor="email" className="label">E-mail</label><input id="email" name="email" type="email" autoComplete="username" required className="field" /></div>
      <div><label htmlFor="password" className="label">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" required className="field" /></div>
      {state && !state.ok && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending && <Loader2 className="size-5 animate-spin" aria-hidden />}{pending ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
