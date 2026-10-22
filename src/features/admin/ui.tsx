"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import type { FormState } from "./form-utils";
import { uploadImageAction } from "./upload-action";
import { cn } from "@/lib/utils";

type Action = (prev: FormState, data: FormData) => Promise<FormState>;

/** Formulário com estado, mensagens de sucesso/erro e bloqueio de envio duplo. */
export function ActionForm({ action, children, className, submitLabel = "Salvar", resetOnSuccess, extra }: {
  action: Action; children: React.ReactNode | ((errors: Record<string, string>) => React.ReactNode); className?: string; submitLabel?: string; resetOnSuccess?: boolean; extra?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const router = useRouter(); const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
    if (state?.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, resetOnSuccess, router]);
  const errors = state?.errors ?? {};
  return (
    <form ref={ref} action={formAction} className={className} noValidate>
      {typeof children === "function" ? children(errors) : children}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-sm">{pending && <Loader2 className="size-4 animate-spin" aria-hidden />}{pending ? "Salvando…" : submitLabel}</button>
        {extra}
        <div aria-live="polite" className="text-sm">
          {state?.ok && state.message && <span className="inline-flex items-center gap-1 font-semibold text-green-800"><CheckCircle2 className="size-4" aria-hidden />{state.message}</span>}
          {state && !state.ok && state.message && <span role="alert" className="font-semibold text-red-700">{state.message}</span>}
        </div>
      </div>
    </form>
  );
}

export function Field({ label, name, error, hint, children, className }: { label: string; name: string; error?: string; hint?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
      {error && <p id={`${name}-err`} role="alert" className="mt-1 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}

export function TextInput({ name, label, error, hint, defaultValue, type = "text", className, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string; error?: string; hint?: string }) {
  return <Field label={label} name={name} error={error} hint={hint} className={className}><input id={name} name={name} type={type} defaultValue={defaultValue} aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined} className="field" {...rest} /></Field>;
}
export function TextArea({ name, label, error, hint, defaultValue, rows = 3, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string; label: string; error?: string; hint?: string }) {
  return <Field label={label} name={name} error={error} hint={hint}><textarea id={name} name={name} rows={rows} defaultValue={defaultValue} aria-invalid={!!error} className="field" {...rest} /></Field>;
}
export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-5 accent-[--brand]" />{label}</label>;
}

/** Confirmação antes de ação destrutiva (sem alert() do navegador). */
export function ConfirmButton({ action, label, message, hidden, danger = true }: { action: Action; label: string; message: string; hidden?: Record<string, string>; danger?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const dlg = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dlg.current?.showModal(); else dlg.current?.close(); }, [open]);
  useEffect(() => { if (state?.ok) dlg.current?.close(); }, [state]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("btn btn-sm", danger ? "border-2 border-red-700 text-red-700 hover:bg-red-700 hover:text-white" : "btn-outline")}>{label}</button>
      <dialog ref={dlg} onClose={() => setOpen(false)} aria-labelledby="cf-title" className="m-auto w-[min(92vw,26rem)] rounded-3xl p-6 backdrop:bg-ink/60">
        <form action={formAction}>
          {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <h2 id="cf-title" className="font-display text-2xl font-extrabold uppercase">Confirmar</h2>
          <p className="mt-2 text-sm">{message}</p>
          {state && !state.ok && state.message && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{state.message}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" disabled={pending} className={cn("btn btn-sm", danger ? "bg-red-700 text-white" : "btn-dark")}>{pending ? "Aguarde…" : label}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}

/** Upload de imagem(ns) para o Storage; o valor (URLs) vai em campo oculto. Validação real ocorre no servidor. */
export function ImageField({ name, label, folder, initial, multiple, max = 8, withAlt }: { name: string; label: string; folder: string; initial?: { url: string; alt?: string }[]; multiple?: boolean; max?: number; withAlt?: boolean }) {
  const [items, setItems] = useState<{ url: string; alt: string }[]>((initial ?? []).map((i) => ({ url: i.url, alt: i.alt ?? "" })));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setErr(null);
    for (const f of Array.from(files).slice(0, multiple ? max - items.length : 1)) {
      const body = new FormData(); body.set("file", f); body.set("folder", folder);
      const r = await uploadImageAction(body).catch(() => ({ ok: false as const, message: "Falha de conexão no envio." }));
      if (!r.ok) { setErr(r.message); break; }
      setItems((cur) => (multiple ? [...cur, { url: r.url, alt: "" }] : [{ url: r.url, alt: "" }]));
    }
    setBusy(false); if (input.current) input.current.value = "";
  }
  const value = multiple || withAlt ? JSON.stringify(items) : (items[0]?.url ?? "");
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <input type="hidden" name={name} value={value} />
      <ul className="flex flex-wrap gap-3">
        {items.map((it, i) => (
          <li key={it.url} className="w-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="relative"><img src={it.url} alt="" className="aspect-square w-full rounded-2xl border border-neutral-200 object-cover" />
              <button type="button" aria-label={`Remover imagem ${i + 1}`} onClick={() => setItems(items.filter((_, k) => k !== i))} className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-red-700 text-white"><X className="size-4" aria-hidden /></button></div>
            {withAlt && <input aria-label={`Texto alternativo da imagem ${i + 1}`} placeholder="Texto alternativo" maxLength={200} value={it.alt} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} className="field mt-1 min-h-9 text-xs" />}
            {multiple && i > 0 && <button type="button" className="mt-1 text-xs underline" onClick={() => { const c = [...items]; [c[i - 1], c[i]] = [c[i] as never, c[i - 1] as never]; setItems(c); }}>mover para trás</button>}
          </li>
        ))}
        {(multiple ? items.length < max : true) && (
          <li><button type="button" disabled={busy} onClick={() => input.current?.click()} className="grid size-28 place-items-center rounded-2xl border-2 border-dashed border-neutral-400 text-xs font-semibold hover:border-ink">
            {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <span className="grid place-items-center gap-1"><ImagePlus className="size-5" aria-hidden />{items.length && !multiple ? "Trocar" : "Enviar"}</span>}</button></li>)}
      </ul>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} className="sr-only" tabIndex={-1} aria-label={`Selecionar arquivo: ${label}`} onChange={(e) => void onFiles(e.target.files)} />
      <p className="mt-1 text-xs text-neutral-600">JPG, PNG, WebP ou AVIF, até 5 MB.</p>
      {err && <p role="alert" className="mt-1 text-sm font-semibold text-red-700">{err}</p>}
    </fieldset>
  );
}
