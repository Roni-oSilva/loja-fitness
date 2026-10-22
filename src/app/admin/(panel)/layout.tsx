import Link from "next/link";
import { LogOut } from "lucide-react";
import { can, requireStaff, type Area } from "@/lib/auth";
import { logoutAction } from "../login/actions";
import { getStoreSettings } from "@/lib/services/catalog";

const NAV: { href: string; label: string; area: Area }[] = [
  { href: "/admin", label: "Dashboard", area: "dashboard" }, { href: "/admin/pedidos", label: "Pedidos", area: "orders" },
  { href: "/admin/produtos", label: "Produtos", area: "products" }, { href: "/admin/categorias", label: "Categorias", area: "categories" },
  { href: "/admin/estoque", label: "Estoque", area: "stock" }, { href: "/admin/cupons", label: "Cupons", area: "coupons" },
  { href: "/admin/clientes", label: "Clientes", area: "customers" }, { href: "/admin/banners", label: "Banners", area: "banners" },
  { href: "/admin/configuracoes", label: "Configurações", area: "settings" }, { href: "/admin/usuarios", label: "Equipe", area: "users" },
];
const ROLE = { admin: "Administrador", manager: "Gerente", editor: "Editor" } as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const s = await getStoreSettings();
  const items = NAV.filter((n) => can(staff.role, n.area));
  return (
    <div className="min-h-dvh bg-mist lg:grid lg:grid-cols-[14rem_1fr]">
      <aside className="on-dark bg-ink text-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-2 px-4 py-3 lg:block lg:py-5">
          <Link href="/admin" className="font-display text-xl font-extrabold uppercase">{s.store_name}</Link>
          <p className="hidden text-xs text-white/70 lg:mt-1 lg:block">{staff.fullName || staff.email} · {ROLE[staff.role]}</p>
          <form action={logoutAction} className="lg:hidden"><button className="grid size-11 place-items-center" aria-label="Sair"><LogOut className="size-5" aria-hidden /></button></form>
        </div>
        <nav aria-label="Painel" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {items.map((n) => <Link key={n.href} href={n.href} className="shrink-0 rounded-2xl px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10">{n.label}</Link>)}
          <Link href="/" target="_blank" className="shrink-0 rounded-2xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10">Ver loja ↗</Link>
        </nav>
        <form action={logoutAction} className="hidden p-4 lg:block"><button className="btn btn-outline btn-sm w-full !border-white/40 !bg-transparent !text-white hover:!bg-white/10"><LogOut className="size-4" aria-hidden />Sair</button></form>
      </aside>
      <main id="conteudo" className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
