import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/money";
import { ConfirmButton } from "@/features/admin/ui";
import { PageHeader, Panel } from "@/features/admin/ui-server";
import { SafeImage } from "@/components/safe-image";
import { ProductForm, type ProductFormData } from "../product-form";
import { archiveProductAction } from "../actions";

export const metadata = { title: "Editar produto" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff("products");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = (await createClient())!;
  const [{ data: p }, { data: cats }] = await Promise.all([db.from("products").select("*, product_images(*), product_variants(*)").eq("id", id).maybeSingle(), db.from("categories").select("id, name").order("sort_order")]);
  if (!p) notFound();
  const images = [...p.product_images].sort((a: any, b: any) => a.sort_order - b.sort_order);
  const data: ProductFormData = {
    ...p, images: images.map((i: any) => ({ url: i.image_url, alt: i.alt_text })),
    variants: [...p.product_variants].sort((a: any, b: any) => a.created_at.localeCompare(b.created_at)).map((v: any) => ({ id: v.id, size: v.size, color: v.color, sku: v.sku, price_override_cents: v.price_override_cents, is_active: v.is_active, stock_quantity: v.stock_quantity })),
  };
  return (
    <>
      <PageHeader title={p.name} subtitle={p.is_demo ? "Produto de demonstração" : undefined} action={
        <div className="flex flex-wrap gap-2">
          {p.status === "published" && <Link href={`/produto/${p.slug}`} target="_blank" className="btn btn-outline btn-sm">Ver na loja ↗</Link>}
          {p.status !== "archived" ? <ConfirmButton action={archiveProductAction} hidden={{ id: p.id, to: "archived" }} label="Arquivar" message="Arquivar este produto? Ele sai da loja, mas o histórico de pedidos é mantido." />
            : <ConfirmButton action={archiveProductAction} hidden={{ id: p.id, to: "draft" }} label="Restaurar como rascunho" danger={false} message="Mover o produto para rascunho?" />}
        </div>} />
      <div className="grid gap-6 2xl:grid-cols-[1fr_20rem]">
        <ProductForm p={data} categories={cats ?? []} canStock={staff.role !== "editor"} />
        <Panel title="Pré-visualização" className="h-fit 2xl:sticky 2xl:top-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-mist">{images[0] && <SafeImage src={images[0].image_url} alt={images[0].alt_text || p.name} sizes="320px" className="object-cover" />}</div>
          <p className="mt-3 font-display text-2xl font-bold uppercase">{p.name}</p>
          <p className="font-extrabold">{p.sale_price_cents != null ? <><span>{formatBRL(p.sale_price_cents)}</span> <s className="text-sm font-normal text-neutral-600">{formatBRL(p.base_price_cents)}</s></> : formatBRL(p.base_price_cents)}</p>
          <p className="mt-2 text-sm text-neutral-700">{p.short_description}</p>
          <p className="mt-3 text-xs text-neutral-600">Mostra os dados salvos. Rascunhos não aparecem para o público.</p>
        </Panel>
      </div>
    </>
  );
}
