#!/usr/bin/env node
/**
 * Cria o PRIMEIRO administrador de forma segura (não há senha padrão nem cadastro público).
 *
 *   node --env-file=.env.local scripts/create-first-admin.mjs voce@exemplo.com "Seu Nome"
 *
 * A senha é pedida no terminal (sem eco) ou lida de ADMIN_PASSWORD. Recusa-se a rodar se já existir um administrador.
 */
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline";

const [email, fullName = ""] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!email || !url || !key) {
  console.error('Uso: node --env-file=.env.local scripts/create-first-admin.mjs <email> "<nome>"\nRequer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

function askHidden(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(prompt)) rl.output.write(s); };
    rl.question(prompt, (a) => { rl.close(); process.stdout.write("\n"); resolve(a); });
  });
}

const password = process.env.ADMIN_PASSWORD ?? (await askHidden("Senha (mín. 12 caracteres): "));
if (password.length < 12) { console.error("A senha precisa ter ao menos 12 caracteres."); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { count, error: ce } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
if (ce) { console.error("Falha ao consultar perfis (as migrations foram aplicadas?):", ce.message); process.exit(1); }
if (count && count > 0) { console.error("Já existe um administrador. Crie novos usuários pelo painel (Equipe)."); process.exit(1); }

const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error || !data.user) { console.error("Não foi possível criar o usuário:", error?.message); process.exit(1); }
const { error: pe } = await db.from("profiles").insert({ id: data.user.id, full_name: fullName, role: "admin" });
if (pe) { await db.auth.admin.deleteUser(data.user.id); console.error("Falha ao criar o perfil:", pe.message); process.exit(1); }
console.log(`Administrador criado: ${email}. Entre em /admin/login.`);
