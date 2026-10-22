"use client";
import { ActionForm, Check, ImageField, TextArea, TextInput } from "@/features/admin/ui";
import { saveBannerAction } from "./actions";

export interface BannerFormData { id?: string; title: string; subtitle: string | null; image_desktop: string | null; image_mobile: string | null; button_label: string | null; target_url: string | null; starts_at: string | null; ends_at: string | null; sort_order: number; is_active: boolean }
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - 3 * 3600_000).toISOString().slice(0, 16) : "");

export function BannerForm({ b }: { b?: BannerFormData }) {
  return (
    <ActionForm action={saveBannerAction} submitLabel={b ? "Salvar banner" : "Criar banner"} className="space-y-4" key={b?.id ?? "new"}>
      {(e) => (<>
        {b?.id && <input type="hidden" name="id" value={b.id} />}
        <TextInput name="title" label="Título" required defaultValue={b?.title} error={e.title} maxLength={120} />
        <TextArea name="subtitle" label="Descrição" rows={2} defaultValue={b?.subtitle ?? ""} error={e.subtitle} maxLength={300} />
        <div className="grid gap-4 sm:grid-cols-2"><ImageField name="image_desktop" label="Imagem desktop (ex.: 1600×600)" folder="banners" initial={b?.image_desktop ? [{ url: b.image_desktop }] : []} /><ImageField name="image_mobile" label="Imagem mobile (ex.: 800×1000)" folder="banners" initial={b?.image_mobile ? [{ url: b.image_mobile }] : []} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><TextInput name="button_label" label="Texto do botão" defaultValue={b?.button_label ?? ""} error={e.button_label} maxLength={40} /><TextInput name="target_url" label="Link de destino" defaultValue={b?.target_url ?? ""} error={e.target_url} placeholder="/produtos ou https://…" /></div>
        <div className="grid gap-4 sm:grid-cols-3"><TextInput name="starts_at" type="datetime-local" label="Exibir a partir de" defaultValue={toLocal(b?.starts_at ?? null)} error={e.starts_at} /><TextInput name="ends_at" type="datetime-local" label="Exibir até" defaultValue={toLocal(b?.ends_at ?? null)} error={e.ends_at} /><TextInput name="sort_order" type="number" min={0} label="Ordem" defaultValue={b?.sort_order ?? 0} error={e.sort_order} /></div>
        <Check name="is_active" label="Banner ativo" defaultChecked={b?.is_active ?? true} />
      </>)}
    </ActionForm>
  );
}
