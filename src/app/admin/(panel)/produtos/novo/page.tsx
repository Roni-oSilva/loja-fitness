import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/features/admin/ui-server";
import { ProductForm } from "../product-form";

export const metadata = { title: "Novo produto" };

export default async function NewProduct() {
  const staff = await requireStaff("products");
  const db = (await createClient())!;
  const { data: cats } = await db.from("categories").select("id, name").order("sort_order");
  return (<><PageHeader title="Novo produto" subtitle="Comece como rascunho; publique quando estiver pronto." /><ProductForm categories={cats ?? []} canStock={staff.role !== "editor"} /></>);
}
