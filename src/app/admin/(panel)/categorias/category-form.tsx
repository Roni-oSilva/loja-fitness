"use client";
import { useState } from "react";
import { ActionForm, Check, ImageField, TextArea, TextInput } from "@/features/admin/ui";
import { saveCategoryAction } from "./actions";
import { slugify } from "@/lib/utils";

export interface CategoryRow { id?: string; name: string; slug: string; description: string | null; image_url: string | null; sort_order: number; is_active: boolean }

export function CategoryForm({ c }: { c?: CategoryRow }) {
  const [slug, setSlug] = useState(c?.slug ?? ""); const [touched, setTouched] = useState(!!c);
  return (
    <ActionForm action={saveCategoryAction} submitLabel={c ? "Salvar categoria" : "Criar categoria"} className="space-y-4" key={c?.id ?? "new"}>
      {(e) => (<>
        {c?.id && <input type="hidden" name="id" value={c.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="name" label="Nome" required defaultValue={c?.name} error={e.name} maxLength={80} onChange={(ev) => { if (!touched) setSlug(slugify(ev.target.value)); }} />
          <TextInput name="slug" label="Slug (endereço)" required value={slug} onChange={(ev) => { setTouched(true); setSlug(ev.target.value); }} error={e.slug} hint="letras minúsculas, números e hífens" />
        </div>
        <TextArea name="description" label="Descrição (opcional)" defaultValue={c?.description ?? ""} error={e.description} maxLength={500} />
        <ImageField name="image_url" label="Imagem da categoria" folder="categories" initial={c?.image_url ? [{ url: c.image_url }] : []} />
        <div className="grid gap-4 sm:grid-cols-2"><TextInput name="sort_order" type="number" min={0} label="Ordem de exibição" defaultValue={c?.sort_order ?? 0} error={e.sort_order} /><Check name="is_active" label="Categoria ativa (visível na loja)" defaultChecked={c?.is_active ?? true} /></div>
      </>)}
    </ActionForm>
  );
}
