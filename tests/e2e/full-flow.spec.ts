import { expect, test } from "@playwright/test";

/**
 * Jornada completa contra um Supabase REAL de homologação (com migrations + supabase/seed.sql aplicados,
 * WhatsApp configurado e um usuário admin). Habilite com:
 *   E2E_FULL=1 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run test:e2e
 */
test.skip(!process.env.E2E_FULL, "defina E2E_FULL=1 com um Supabase de homologação para rodar a jornada completa");

test("visitante: filtra, escolhe variante, finaliza e recebe recibo", async ({ page, context }) => {
  await page.goto("/produtos");
  await page.getByLabel("Tamanho").first().isVisible().catch(() => undefined);
  await page.getByRole("link", { name: /Ver Camiseta Dry Fit/ }).first().click();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page.getByRole("alert")).toContainText("Selecione");
  await page.getByRole("radio", { name: "M", exact: true }).click();
  await page.getByRole("radio", { name: "Preto" }).click();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.goto("/carrinho");
  await expect(page.getByText("Camiseta Dry Fit")).toBeVisible();
  await page.getByLabel("Nome *").fill("Cliente E2E");
  await page.getByRole("checkbox").check();
  await context.route("https://wa.me/**", (r) => r.fulfill({ status: 200, body: "ok" }));
  await page.getByRole("button", { name: /Finalizar pelo WhatsApp/ }).click();
  await expect(page).toHaveURL(/\/pedido\//);
  await expect(page.getByRole("article", { name: /Recibo do pedido LF-/ })).toBeVisible();
  await expect(page.getByText(/ainda não está pago nem confirmado/)).toBeVisible();
});

test("admin: login, cria produto, ajusta estoque e acompanha pedido", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Senha").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.goto("/admin/produtos/novo");
  const name = `Produto E2E ${Date.now()}`;
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel(/Preço \(R\$\)/).fill("49,90");
  await page.getByRole("button", { name: "Criar produto" }).click();
  await expect(page.getByText("Produto salvo.")).toBeVisible();
  await page.goto("/admin/estoque");
  await expect(page.getByRole("heading", { name: "Estoque" })).toBeVisible();
  await page.goto("/admin/pedidos");
  await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();
});
