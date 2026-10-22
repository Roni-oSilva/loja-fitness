"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, Check, Field, ImageField, TextArea, TextInput } from "@/features/admin/ui";
import { saveProductAction } from "./actions";
import { centsToInput } from "@/lib/money";
import { slugify } from "@/lib/utils";

export interface ProductFormData {
  id?: string; name: string; slug: string; short_description: string | null; description: string | null; category_id: string | null;
  base_price_cents: number; sale_price_cents: number | null; sale_starts_at: string | null; sale_ends_at: string | null; sku: string | null;
  status: "draft" | "published" | "archived"; is_featured: boolean; badge: string | null; size_guide: string | null; care_instructions: string | null;
  seo_title: string | null; seo_description: string | null;
  images: { url: string; alt: string }[];
  variants: { id?: string; size: string | null; color: string | null; sku: string | null; price_override_cents: number | null; is_active: boolean; stock_quantity?: number }[];
}
interface VRow { id?: string; size: string; color: string; sku: string; price: string; is_active: boolean; initial_stock: string; stock?: number }

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function ProductForm({ p, categories, canStock }: { p?: ProductFormData; categories: { id: string; name: string }[]; canStock: boolean }) {
  const [slug, setSlug] = useState(p?.slug ?? ""); const [touched, setTouched] = useState(!!p);
  const [rows, setRows] = useState<VRow[]>(p?.variants.length ? p.variants.map((v) => ({ id: v.id, size: v.size ?? "", color: v.color ?? "", sku: v.sku ?? "", price: centsToInput(v.price_override_cents), is_active: v.is_active, initial_stock: "0", stock: v.stock_quantity })) : [{ size: "", color: "", sku: "", price: "", is_active: true, initial_stock: "0" }]);
  const set = (i: number, patch: Partial<VRow>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const variantsJson = JSON.stringify(rows.map((r) => ({ id: r.id, size: r.size, color: r.color, sku: r.sku, price_override_cents: r.price, is_active: r.is_active, initial_stock: r.initial_stock || "0" })));
  const cell = "field min-h-10 text-sm";

  return (
    <ActionForm action={saveProductAction} submitLabel={p ? "Salvar produto" : "Criar produto"} className="space-y-6">
      {(e) => (<>
        {p?.id && <input type="hidden" name="id" value={p.id} />}
        <input type="hidden" name="variants_json" value={variantsJson} />
        <fieldset className="card space-y-4 p-4 sm:p-5"><legend className="px-1 font-display text-2xl font-bold uppercase">Informações</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="name" label="Nome" required defaultValue={p?.name} error={e.name} maxLength={140} onChange={(ev) => { if (!touched) setSlug(slugify(ev.target.value)); }} />
            <TextInput name="slug" label="Slug (endereço)" required value={slug} error={e.slug} onChange={(ev) => { setTouched(true); setSlug(ev.target.value); }} />
          </div>
          <TextInput name="short_description" label="Descrição curta" defaultValue={p?.short_description ?? ""} error={e.short_description} maxLength={280} />
          <TextArea name="description" label="Descrição completa" rows={5} defaultValue={p?.description ?? ""} error={e.description} maxLength={8000} hint="Evite prometer resultados físicos." />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Categoria" name="category_id" error={e.category_id}><select id="category_id" name="category_id" defaultValue={p?.category_id ?? ""} className="field"><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Status" name="status" error={e.status}><select id="status" name="status" defaultValue={p?.status ?? "draft"} className="field"><option value="draft">Rascunho (não visível)</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></Field>
            <TextInput name="sku" label="SKU do produto (opcional)" defaultValue={p?.sku ?? ""} error={e.sku} maxLength={60} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="badge" label="Etiqueta (ex.: Novo)" defaultValue={p?.badge ?? ""} maxLength={24} error={e.badge} /><Check name="is_featured" label="Produto em destaque na página inicial" defaultChecked={p?.is_featured} /></div>
        </fieldset>

        <fieldset className="card space-y-4 p-4 sm:p-5"><legend className="px-1 font-display text-2xl font-bold uppercase">Preço</legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextInput name="base_price_cents" label="Preço (R$)" required inputMode="decimal" defaultValue={p ? centsToInput(p.base_price_cents) : ""} error={e.base_price_cents} placeholder="99,90" />
            <TextInput name="sale_price_cents" label="Preço promocional (R$)" inputMode="decimal" defaultValue={centsToInput(p?.sale_price_cents)} error={e.sale_price_cents} hint="Opcional; menor que o preço" />
            <TextInput name="sale_starts_at" type="datetime-local" label="Promoção começa" defaultValue={toLocal(p?.sale_starts_at ?? null)} error={e.sale_starts_at} />
            <TextInput name="sale_ends_at" type="datetime-local" label="Promoção termina" defaultValue={toLocal(p?.sale_ends_at ?? null)} error={e.sale_ends_at} />
          </div>
        </fieldset>

        <fieldset className="card p-4 sm:p-5"><legend className="px-1 font-display text-2xl font-bold uppercase">Imagens</legend>
          <ImageFieldJson initial={p?.images ?? []} />
          {e.images && <p role="alert" className="mt-1 text-sm font-semibold text-red-700">{e.images}</p>}
        </fieldset>

        <fieldset className="card p-4 sm:p-5"><legend className="px-1 font-display text-2xl font-bold uppercase">Variantes e estoque</legend>
          <p className="mb-3 text-sm text-neutral-700">Cada linha é uma combinação válida de tamanho/cor. Produto sem opções: deixe uma linha com tamanho e cor vazios. O estoque de variantes existentes só muda na tela <strong>Estoque</strong> (com histórico).</p>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className={`grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_7rem_6rem_auto] ${r.is_active ? "border-neutral-200" : "border-dashed bg-neutral-50 opacity-70"}`}>
                <div><label className="label text-xs" htmlFor={`vs${i}`}>Tamanho</label><input id={`vs${i}`} className={cell} value={r.size} maxLength={20} onChange={(ev) => set(i, { size: ev.target.value })} placeholder="M" /></div>
                <div><label className="label text-xs" htmlFor={`vc${i}`}>Cor</label><input id={`vc${i}`} className={cell} value={r.color} maxLength={40} onChange={(ev) => set(i, { color: ev.target.value })} placeholder="Preto" /></div>
                <div><label className="label text-xs" htmlFor={`vk${i}`}>SKU</label><input id={`vk${i}`} className={cell} value={r.sku} maxLength={60} onChange={(ev) => set(i, { sku: ev.target.value })} /></div>
                <div><label className="label text-xs" htmlFor={`vp${i}`}>Preço próprio</label><input id={`vp${i}`} className={cell} inputMode="decimal" value={r.price} onChange={(ev) => set(i, { price: ev.target.value })} placeholder="opcional" /></div>
                <div>{r.id ? <><p className="label text-xs">Estoque</p><p className="flex min-h-10 items-center font-bold">{r.stock}</p></> : canStock ? <><label className="label text-xs" htmlFor={`vq${i}`}>Estoque inicial</label><input id={`vq${i}`} className={cell} type="number" min={0} value={r.initial_stock} onChange={(ev) => set(i, { initial_stock: ev.target.value })} /></> : <p className="label text-xs">Estoque: via gerente</p>}</div>
                <div className="flex items-end gap-1">
                  <label className="flex min-h-10 items-center gap-1 text-xs font-semibold"><input type="checkbox" checked={r.is_active} onChange={(ev) => set(i, { is_active: ev.target.checked })} className="size-5 accent-[--brand]" />Ativa</label>
                  {!r.id && <button type="button" aria-label="Remover linha" className="grid size-10 place-items-center text-red-700" onClick={() => setRows(rows.filter((_, k) => k !== i))}><Trash2 className="size-4" aria-hidden /></button>}
                </div>
              </div>))}
          </div>
          {e.variants && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{e.variants}</p>}
          <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => setRows([...rows, { size: "", color: "", sku: "", price: "", is_active: true, initial_stock: "0" }])}><Plus className="size-4" aria-hidden />Adicionar variante</button>
        </fieldset>

        <fieldset className="card space-y-4 p-4 sm:p-5"><legend className="px-1 font-display text-2xl font-bold uppercase">Detalhes e SEO</legend>
          <TextArea name="size_guide" label="Tabela de medidas" rows={3} defaultValue={p?.size_guide ?? ""} maxLength={4000} error={e.size_guide} />
          <TextArea name="care_instructions" label="Instruções de conservação" rows={2} defaultValue={p?.care_instructions ?? ""} maxLength={2000} error={e.care_instructions} />
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="seo_title" label="Título SEO" defaultValue={p?.seo_title ?? ""} maxLength={70} error={e.seo_title} /><TextInput name="seo_description" label="Descrição SEO" defaultValue={p?.seo_description ?? ""} maxLength={160} error={e.seo_description} /></div>
        </fieldset>
      </>)}
    </ActionForm>
  );
}

function ImageFieldJson({ initial }: { initial: { url: string; alt: string }[] }) {
  return <ImageField name="images_json" label="Fotos (a primeira é a principal)" folder="products" multiple withAlt initial={initial} />;
}
