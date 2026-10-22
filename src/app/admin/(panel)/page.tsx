import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/money";
import { nowMs } from "@/lib/time";
import { PageHeader, Panel } from "@/features/admin/ui-server";

interface Stats {
  orders_total: number; orders_pending_contact: number; orders_confirmed: number; created_value_cents: number; confirmed_value_cents: number;
  received_value_cents: number; products_total: number; products_unavailable: number; variants_low_stock: number;
  series: { day: string; confirmed_cents: number; orders: number }[]; top_products: { name: string; quantity: number }[];
}
const PERIODS = [{ d: 7, l: "7 dias" }, { d: 30, l: "30 dias" }, { d: 90, l: "90 dias" }, { d: 365, l: "12 meses" }];

const Card = ({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: string }) => (
    <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wide text-neutral-600">{label}</p><p className={`mt-1 font-display text-4xl font-extrabold leading-none ${tone ?? ""}`}>{value}</p>{hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}</div>
  );

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ dias?: string; negado?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const days = PERIODS.some((p) => String(p.d) === sp.dias) ? Number(sp.dias) : 30;
  const db = (await createClient())!;
  let stats: Stats | null = null; let failed = false;
  if (staff.role === "admin" || staff.role === "manager") {
    const to = new Date(nowMs() + 60_000), from = new Date(nowMs() - days * 86_400_000);
    const { data, error } = await db.rpc("admin_dashboard", { p_from: from.toISOString(), p_to: to.toISOString() });
    if (error) { console.error("[dashboard]", error.code); failed = true; } else stats = data as Stats;
  }
  const max = Math.max(1, ...(stats?.series.map((s) => s.confirmed_cents) ?? [0]));
  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Olá, ${staff.fullName || "equipe"}.`} action={stats && <nav aria-label="Período" className="flex flex-wrap gap-1">{PERIODS.map((p) => <Link key={p.d} href={`/admin?dias=${p.d}`} aria-current={p.d === days} className={`rounded-2xl px-3 py-2 text-sm font-bold ${p.d === days ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-neutral-300"}`}>{p.l}</Link>)}</nav>} />
      {sp.negado && <p role="alert" className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">Você não tem permissão para acessar essa área.</p>}
      {staff.role === "editor" && <Panel title="Bem-vindo"><p className="text-sm">Seu perfil (editor) gerencia produtos, categorias e banners. Use o menu para navegar.</p></Panel>}
      {failed && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">Não foi possível carregar os indicadores. Tente recarregar a página.</p>}
      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card label="Pedidos criados" value={stats.orders_total} hint={`últimos ${days} dias`} />
            <Card label="Aguardando contato" value={stats.orders_pending_contact} tone={stats.orders_pending_contact ? "text-brand-strong" : ""} hint="ainda sem atendimento" />
            <Card label="Confirmados" value={stats.orders_confirmed} hint="confirmado, em preparo, enviado ou entregue" />
            <Card label="Produtos cadastrados" value={stats.products_total} hint="exceto arquivados" />
            <Card label="Valor dos pedidos criados" value={formatBRL(stats.created_value_cents)} hint="inclui pendentes; não é receita" />
            <Card label="Valor confirmado" value={formatBRL(stats.confirmed_value_cents)} hint="vendas confirmadas com a cliente" />
            <Card label="Valor recebido" value={formatBRL(stats.received_value_cents)} hint="somente pedidos com pagamento registrado" />
            <Card label="Atenção no estoque" value={`${stats.products_unavailable} / ${stats.variants_low_stock}`} hint="indisponíveis / variantes em estoque baixo" tone={stats.products_unavailable ? "text-red-700" : ""} />
          </div>
          <Panel title="Vendas confirmadas por dia">
            {stats.series.length ? (
              <ol className="flex h-44 items-end gap-1 overflow-x-auto" aria-label="Gráfico de vendas confirmadas por dia">
                {stats.series.map((s) => (
                  <li key={s.day} className="flex h-full min-w-6 flex-1 flex-col justify-end text-center" title={`${s.day}: ${formatBRL(s.confirmed_cents)} (${s.orders} pedido${s.orders > 1 ? "s" : ""})`}>
                    <div className="w-full rounded-t bg-brand" style={{ height: `${Math.max(4, (s.confirmed_cents / max) * 100)}%` }} />
                    <span className="mt-1 text-[10px] text-neutral-600">{s.day.slice(8)}/{s.day.slice(5, 7)}</span>
                    <span className="sr-only">{formatBRL(s.confirmed_cents)}</span>
                  </li>))}
              </ol>) : <p className="text-sm text-neutral-600">Nenhuma venda confirmada no período.</p>}
          </Panel>
          <Panel title="Mais vendidos (confirmados)">
            {stats.top_products.length ? <ol className="space-y-1 text-sm">{stats.top_products.map((p, i) => <li key={i} className="flex justify-between border-b border-neutral-100 py-1.5"><span>{i + 1}. {p.name}</span><strong>{p.quantity} un.</strong></li>)}</ol>
              : <p className="text-sm text-neutral-600">Sem histórico real ainda. Esta lista só considera pedidos confirmados.</p>}
          </Panel>
        </div>)}
    </>
  );
}
