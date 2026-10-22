import { expect, test } from "@playwright/test";

/** Jornadas que não dependem de dados no banco (rodam contra `next start`, mesmo sem Supabase configurado). */
const WIDTHS = [320, 375, 430, 768, 1024, 1440];

test.describe("páginas públicas", () => {
  for (const w of WIDTHS) {
    test(`sem rolagem horizontal em ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      for (const path of ["/", "/produtos", "/carrinho", "/contato", "/politica-de-privacidade", "/favoritos"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} em ${w}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  test("landing: hero com textos e botões da marca, cabeçalho com marca centralizada", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("SEU PRÓXIMO NÍVEL COMEÇA AQUI.");
    await expect(page.getByRole("link", { name: /COMPRAR AGORA/ })).toHaveAttribute("href", "/produtos");
    await expect(page.getByRole("link", { name: /EXPLORAR COLEÇÃO/ })).toBeVisible();
    const brand = page.getByRole("banner").getByRole("link", { name: /página inicial/ });
    const box = await brand.boundingBox(); const vw = page.viewportSize()!.width;
    expect(Math.abs(box!.x + box!.width / 2 - vw / 2)).toBeLessThan(8);
  });

  test("catálogo vazio mostra estado vazio, sem dados inventados", async ({ page }) => {
    await page.goto("/produtos");
    await expect(page.getByRole("heading", { name: "Todos os produtos" })).toBeVisible();
    await expect(page.getByText(/Catálogo em preparação|Nada encontrado/)).toBeVisible();
  });

  test("carrinho vazio e busca", async ({ page }) => {
    await page.goto("/carrinho");
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
    await page.goto("/busca?q=legging");
    await expect(page.getByText(/0 produtos/)).toBeVisible();
  });

  test("política de privacidade exibe aviso de modelo provisório", async ({ page }) => {
    await page.goto("/politica-de-privacidade");
    await expect(page.getByText(/Texto-modelo provisório/)).toBeVisible();
  });

  test("404 personalizada e pedido inexistente não revela nada", async ({ page }) => {
    const r = await page.goto("/pagina-que-nao-existe");
    expect(r?.status()).toBe(404);
    await expect(page.getByText("Página não encontrada")).toBeVisible();
    const r2 = await page.goto("/pedido/00000000-0000-4000-8000-000000000000?t=tokeninvalidotokeninvalido");
    expect(r2?.status()).toBe(404);
  });

  test("cabeçalhos de segurança e robots", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-powered-by"]).toBeUndefined();
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /pedido/");
  });

  test("menu mobile abre e fecha com Esc", async ({ page, isMobile }) => {
    test.skip(!isMobile, "somente no projeto mobile");
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });
});

test.describe("área administrativa", () => {
  test("rotas /admin exigem login e não são indexáveis", async ({ page, request }) => {
    for (const p of ["/admin", "/admin/pedidos", "/admin/produtos/novo", "/admin/configuracoes"]) {
      await page.goto(p);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
    const res = await request.get("/admin/login");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    expect(res.headers()["cache-control"]).toContain("no-store");
  });

  test("login: validação e mensagem genérica", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await page.getByLabel("E-mail").fill("naoexiste@exemplo.com");
    await page.getByLabel("Senha").fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /Supabase|incorretos/ }).last()).toBeVisible();
  });
});
