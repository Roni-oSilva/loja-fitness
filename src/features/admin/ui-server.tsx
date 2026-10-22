import Link from "next/link";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PageHeader({ title, action, subtitle }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-4xl font-extrabold uppercase leading-none">{title}</h1>{subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}</div>
      {action}
    </div>
  );
}
export const Panel = ({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) => (
  <section className={cn("card p-4 sm:p-5", className)}>{title && <h2 className="mb-3 font-display text-2xl font-bold uppercase">{title}</h2>}{children}</section>
);
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => <th scope="col" className={cn("px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-neutral-600", className)}>{children}</th>;
export const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => <td className={cn("px-3 py-2.5 align-top text-sm", className)}>{children}</td>;
export const TableWrap = ({ children }: { children: React.ReactNode }) => <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white"><table className="w-full min-w-[40rem] divide-y divide-neutral-200">{children}</table></div>;
export const NoRows = ({ cols, text }: { cols: number; text: string }) => <tr><td colSpan={cols} className="px-3 py-10 text-center text-sm text-neutral-600">{text}</td></tr>;

const TONE: Record<OrderStatus, string> = {
  pending_contact: "bg-amber-100 text-amber-900", awaiting_confirmation: "bg-sky-100 text-sky-900", confirmed: "bg-lime-200 text-lime-950",
  processing: "bg-indigo-100 text-indigo-900", shipped: "bg-violet-100 text-violet-900", delivered: "bg-green-200 text-green-950", cancelled: "bg-neutral-200 text-neutral-700",
};
export const StatusBadge = ({ status }: { status: OrderStatus }) => <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", TONE[status])}>{ORDER_STATUS_LABEL[status]}</span>;
export const Pill = ({ ok, yes, no }: { ok: boolean; yes: string; no: string }) => <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", ok ? "bg-green-100 text-green-900" : "bg-neutral-200 text-neutral-700")}>{ok ? yes : no}</span>;
export const LinkBtn = ({ href, children, outline }: { href: string; children: React.ReactNode; outline?: boolean }) => <Link href={href} className={cn("btn btn-sm", outline ? "btn-outline" : "btn-primary")}>{children}</Link>;
export const dt = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso)) : "—");
