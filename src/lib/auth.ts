import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { UserRole } from "./types";

export interface Staff { id: string; email: string | null; fullName: string; role: UserRole }

/** Usuário autenticado COM perfil administrativo. Autenticado sem perfil = sem acesso. */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: claims } = await supabase.auth.getUser();
  const user = claims.user;
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  if (!profile) return null;
  return { id: user.id, email: user.email ?? null, fullName: profile.full_name, role: profile.role as UserRole };
});

export const PERMISSIONS = {
  dashboard: ["admin", "manager"],
  products: ["admin", "manager", "editor"],
  categories: ["admin", "editor"],
  stock: ["admin", "manager"],
  orders: ["admin", "manager"],
  coupons: ["admin", "manager"],
  customers: ["admin", "manager"],
  banners: ["admin", "editor"],
  settings: ["admin"],
  users: ["admin"],
} as const satisfies Record<string, readonly UserRole[]>;
export type Area = keyof typeof PERMISSIONS;

export const can = (role: UserRole, area: Area) => (PERMISSIONS[area] as readonly UserRole[]).includes(role);

/** Para páginas: redireciona ao login ou à home do painel quando faltar permissão. */
export async function requireStaff(area?: Area): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (area && !can(staff.role, area)) redirect("/admin?negado=1");
  return staff;
}

export class ForbiddenError extends Error {}
/** Para Server Actions: lança em vez de redirecionar. */
export async function assertStaff(area: Area): Promise<Staff> {
  const staff = await getStaff();
  if (!staff || !can(staff.role, area)) throw new ForbiddenError("Sem permissão para esta ação.");
  return staff;
}
