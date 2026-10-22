/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { ActionForm, Check, Field, ImageField, TextArea, TextInput } from "@/features/admin/ui";
import { saveSettingsAction } from "./actions";
import { centsToInput } from "@/lib/money";
import type { StoreSettings } from "@/lib/types";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <fieldset className="card space-y-4 p-4 sm:p-5"><legend className="px-1 font-display text-2xl font-bold uppercase">{title}</legend>{children}</fieldset>;

export function SettingsForm({ s }: { s: StoreSettings }) {
  const [benefits, setBenefits] = useState(() => Array.from({ length: 4 }, (_, i) => s.benefits[i] ?? { title: "", description: "" }));
  const [editorial, setEditorial] = useState(() => Array.from({ length: 2 }, (_, i) => s.editorial[i] ?? { title: "", text: "", image_url: null, link: null }));
  const [social, setSocial] = useState(() => Array.from({ length: 4 }, (_, i) => s.social_gallery[i] ?? { image_url: "", link_url: "", alt: "" }));
  return (
    <ActionForm action={saveSettingsAction} submitLabel="Salvar configurações" className="space-y-6">
      {(e) => (<>
        <input type="hidden" name="benefits_json" value={JSON.stringify(benefits)} /><input type="hidden" name="editorial_json" value={JSON.stringify(editorial)} /><input type="hidden" name="social_json" value={JSON.stringify(social)} />
        <Section title="Marca">
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="store_name" label="Nome da loja" required defaultValue={s.store_name} error={e.store_name} maxLength={60} /><TextInput name="tagline" label="Descrição institucional" defaultValue={s.tagline ?? ""} error={e.tagline} maxLength={160} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><ImageField name="logo_url" label="Logotipo (aparece no topo, no rodapé e no recibo)" folder="branding" initial={s.logo_url ? [{ url: s.logo_url }] : []} /><ImageField name="favicon_url" label="Favicon" folder="branding" initial={s.favicon_url ? [{ url: s.favicon_url }] : []} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput name="theme_primary" label="Cor principal (laranja)" defaultValue={s.theme_primary} error={e.theme_primary} /><TextInput name="theme_accent" label="Cor de destaque (verde)" defaultValue={s.theme_accent} error={e.theme_accent} /><TextInput name="theme_dark" label="Cor escura" defaultValue={s.theme_dark} error={e.theme_dark} />
          </div>
        </Section>
        <Section title="Atendimento">
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="whatsapp_number" label="WhatsApp (com DDI e DDD)" defaultValue={s.whatsapp_number ?? ""} error={e.whatsapp_number} placeholder="5511999998888" hint="Obrigatório para finalizar pedidos." /><TextInput name="contact_email" type="email" label="E-mail comercial" defaultValue={s.contact_email ?? ""} error={e.contact_email} /></div>
          <TextInput name="address" label="Endereço comercial (opcional)" defaultValue={s.address ?? ""} error={e.address} maxLength={300} />
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="instagram_url" label="Instagram (https://…)" defaultValue={s.instagram_url ?? ""} error={e.instagram_url} /><TextInput name="facebook_url" label="Facebook" defaultValue={s.facebook_url ?? ""} error={e.facebook_url} /><TextInput name="tiktok_url" label="TikTok" defaultValue={s.tiktok_url ?? ""} error={e.tiktok_url} /><TextInput name="youtube_url" label="YouTube" defaultValue={s.youtube_url ?? ""} error={e.youtube_url} /></div>
        </Section>
        <Section title="Barra promocional e entrega">
          <Check name="promo_bar_enabled" label="Exibir barra promocional no topo" defaultChecked={s.promo_bar_enabled} />
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="promo_bar_text" label="Mensagem" defaultValue={s.promo_bar_text ?? ""} error={e.promo_bar_text} maxLength={160} hint="Use {frete_gratis} para inserir o valor mínimo configurado abaixo." /><TextInput name="promo_bar_link" label="Link (opcional)" defaultValue={s.promo_bar_link ?? ""} error={e.promo_bar_link} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="free_shipping_threshold_cents" label="Frete grátis a partir de (R$)" defaultValue={centsToInput(s.free_shipping_threshold_cents)} error={e.free_shipping_threshold_cents} hint="Deixe vazio se não houver frete grátis. Só é anunciado/aplicado se preenchido." /><TextInput name="low_stock_threshold" type="number" min={0} label="Limite de estoque baixo" defaultValue={s.low_stock_threshold} error={e.low_stock_threshold} /></div>
          <TextArea name="delivery_info" label="Condições de entrega" defaultValue={s.delivery_info ?? ""} error={e.delivery_info} rows={3} maxLength={2000} />
        </Section>
        <Section title="Página inicial">
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="hero_title" label="Título do hero" required defaultValue={s.hero_title} error={e.hero_title} /><TextInput name="featured_title" label="Título dos destaques" required defaultValue={s.featured_title} error={e.featured_title} /></div>
          <TextArea name="hero_subtitle" label="Subtítulo do hero" required defaultValue={s.hero_subtitle} error={e.hero_subtitle} rows={2} />
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="hero_cta_label" label="Botão principal" defaultValue={s.hero_cta_label} error={e.hero_cta_label} /><TextInput name="hero_cta_link" label="Link do botão principal" defaultValue={s.hero_cta_link} error={e.hero_cta_link} /><TextInput name="hero_secondary_label" label="Botão secundário" defaultValue={s.hero_secondary_label} error={e.hero_secondary_label} /><TextInput name="hero_secondary_link" label="Link do botão secundário" defaultValue={s.hero_secondary_link} error={e.hero_secondary_link} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><ImageField name="hero_image_url" label="Foto do hero (desktop)" folder="content" initial={s.hero_image_url ? [{ url: s.hero_image_url }] : []} /><ImageField name="hero_image_mobile_url" label="Foto do hero (celular)" folder="content" initial={s.hero_image_mobile_url ? [{ url: s.hero_image_mobile_url }] : []} /></div>
          <div><h3 className="label">Benefícios (deixe em branco para ocultar)</h3>{e.benefits && <p role="alert" className="text-sm font-semibold text-red-700">{e.benefits}</p>}
            <div className="grid gap-3 sm:grid-cols-2">{benefits.map((b, i) => <div key={i} className="space-y-2 rounded-lg border border-neutral-200 p-3"><input aria-label={`Título do benefício ${i + 1}`} placeholder="Título" className="field min-h-10" maxLength={60} value={b.title} onChange={(ev) => setBenefits(benefits.map((x, k) => (k === i ? { ...x, title: ev.target.value } : x)))} /><input aria-label={`Descrição do benefício ${i + 1}`} placeholder="Descrição" className="field min-h-10" maxLength={200} value={b.description} onChange={(ev) => setBenefits(benefits.map((x, k) => (k === i ? { ...x, description: ev.target.value } : x)))} /></div>)}</div>
            <p className="mt-1 text-xs text-neutral-600">Só descreva condições reais (entrega, pagamento, troca).</p></div>
          <div><h3 className="label">Conteúdo de marca (2 blocos)</h3>{e.editorial && <p role="alert" className="text-sm font-semibold text-red-700">{e.editorial}</p>}
            <div className="grid gap-3 lg:grid-cols-2">{editorial.map((b, i) => <div key={i} className="space-y-2 rounded-lg border border-neutral-200 p-3">
              <input aria-label={`Título do bloco ${i + 1}`} placeholder="Título (ex.: VISTA SUA EVOLUÇÃO.)" className="field min-h-10" maxLength={80} value={b.title} onChange={(ev) => setEditorial(editorial.map((x, k) => (k === i ? { ...x, title: ev.target.value } : x)))} />
              <input aria-label={`Texto do bloco ${i + 1}`} placeholder="Texto curto" className="field min-h-10" maxLength={300} value={b.text} onChange={(ev) => setEditorial(editorial.map((x, k) => (k === i ? { ...x, text: ev.target.value } : x)))} />
              <input aria-label={`Link do bloco ${i + 1}`} placeholder="Link (/produtos)" className="field min-h-10" value={b.link ?? ""} onChange={(ev) => setEditorial(editorial.map((x, k) => (k === i ? { ...x, link: ev.target.value || null } : x)))} />
              <EditorialImage value={b.image_url} onChange={(u) => setEditorial(editorial.map((x, k) => (k === i ? { ...x, image_url: u } : x)))} /></div>)}</div></div>
          <div><h3 className="label">Galeria das redes sociais</h3>{e.social && <p role="alert" className="text-sm font-semibold text-red-700">{e.social}</p>}
            <div className="grid gap-3 sm:grid-cols-2">{social.map((b, i) => <div key={i} className="space-y-2 rounded-lg border border-neutral-200 p-3">
              <SocialImage value={b.image_url} onChange={(u) => setSocial(social.map((x, k) => (k === i ? { ...x, image_url: u } : x)))} />
              <input aria-label={`Link da publicação ${i + 1}`} placeholder="Link https da publicação" className="field min-h-10" value={b.link_url} onChange={(ev) => setSocial(social.map((x, k) => (k === i ? { ...x, link_url: ev.target.value } : x)))} />
              <input aria-label={`Descrição da imagem ${i + 1}`} placeholder="Descrição da imagem" className="field min-h-10" maxLength={120} value={b.alt} onChange={(ev) => setSocial(social.map((x, k) => (k === i ? { ...x, alt: ev.target.value } : x)))} /></div>)}</div></div>
        </Section>
        <Section title="Textos legais e SEO">
          <p className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">Enquanto estes campos estiverem vazios, o site mostra textos-modelo provisórios. Revise com um profissional antes de lançar.</p>
          <TextArea name="privacy_text" label="Política de privacidade" rows={6} defaultValue={s.privacy_text ?? ""} error={e.privacy_text} maxLength={20000} />
          <TextArea name="terms_text" label="Termos de uso" rows={6} defaultValue={s.terms_text ?? ""} error={e.terms_text} maxLength={20000} />
          <TextArea name="management_text" label="Política de gestão (pedidos, estoque, atendimento e dados)" rows={6} defaultValue={s.management_text ?? ""} error={e.management_text} maxLength={20000} />
          <TextArea name="returns_text" label="Trocas e devoluções" rows={6} defaultValue={s.returns_text ?? ""} error={e.returns_text} maxLength={12000} />
          <div className="grid gap-4 sm:grid-cols-2"><TextInput name="seo_title" label="Título SEO global" defaultValue={s.seo_title ?? ""} error={e.seo_title} maxLength={70} /><TextInput name="seo_description" label="Descrição SEO global" defaultValue={s.seo_description ?? ""} error={e.seo_description} maxLength={160} /></div>
        </Section>
      </>)}
    </ActionForm>
  );
}

import { uploadImageAction } from "@/features/admin/upload-action";
function SingleUpload({ value, onChange, label, folder }: { value: string | null; onChange: (u: string | null) => void; label: string; folder: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      {value && <img src={value} alt="" className="mb-1 h-16 w-28 rounded object-cover" />}
      <label className="btn btn-outline btn-sm cursor-pointer">{busy ? "Enviando…" : value ? `Trocar ${label}` : `Enviar ${label}`}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy} onChange={async (ev) => {
          const f = ev.target.files?.[0]; if (!f) return; setBusy(true); setErr(null);
          const body = new FormData(); body.set("file", f); body.set("folder", folder);
          const r = await uploadImageAction(body).catch(() => ({ ok: false as const, message: "Falha de conexão." }));
          setBusy(false); if (r.ok) onChange(r.url); else setErr(r.message);
        }} /></label>
      {value && <button type="button" className="ml-2 text-xs underline" onClick={() => onChange(null)}>remover</button>}
      {err && <p role="alert" className="text-xs font-semibold text-red-700">{err}</p>}
    </div>
  );
}
const EditorialImage = ({ value, onChange }: { value: string | null; onChange: (u: string | null) => void }) => <SingleUpload value={value} onChange={onChange} label="imagem" folder="content" />;
const SocialImage = ({ value, onChange }: { value: string; onChange: (u: string) => void }) => <SingleUpload value={value || null} onChange={(u) => onChange(u ?? "")} label="imagem" folder="content" />;
void Field;
