import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { as, createDb } from "./harness";

let db: PGlite;
const ADMIN = "00000000-0000-0000-0000-000000000001";
const MANAGER = "00000000-0000-0000-0000-000000000002";
const EDITOR = "00000000-0000-0000-0000-000000000003";
const NOBODY = "00000000-0000-0000-0000-000000000009";
let variantId: string; let productId: string; let draftId: string;

const orderPayload = (over: Record<string, unknown> = {}) => ({
  idempotency_key: "key-" + Math.random().toString(36).slice(2) + "xxxxxxxxxxxx",
  access_token_hash: "hash",
  customer: { name: "Maria Teste", phone: "11999998888" },
  items: [{ variant_id: variantId, quantity: 2, unit_price_cents: 8990 }],
  discount_cents: 0,
  ...over,
});
const createOrder = (p: object) =>
  as(db, "service_role", null, async () => (await db.query<{ order_id: string; order_number: string; deduplicated: boolean }>("select * from public.create_order($1::jsonb)", [JSON.stringify(p)])).rows[0]!);

beforeAll(async () => {
  db = await createDb();
  await db.exec(`
    insert into auth.users (id, email) values ('${ADMIN}','a@x'),('${MANAGER}','m@x'),('${EDITOR}','e@x'),('${NOBODY}','n@x');
    insert into public.profiles (id, full_name, role) values ('${ADMIN}','A','admin'),('${MANAGER}','M','manager'),('${EDITOR}','E','editor');
    insert into public.categories (id, name, slug) values ('10000000-0000-0000-0000-000000000001','Camisetas','camisetas');
    insert into public.products (id, name, slug, category_id, base_price_cents, sale_price_cents, status)
      values ('20000000-0000-0000-0000-000000000001','Camiseta Demo','camiseta-demo','10000000-0000-0000-0000-000000000001', 9990, 8990, 'published'),
             ('20000000-0000-0000-0000-000000000002','Rascunho','rascunho', null, 5000, null, 'draft');
    insert into public.product_variants (id, product_id, size, color) values
      ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','M','Preto'),
      ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','M','Preto');
  `);
  productId = "20000000-0000-0000-0000-000000000001";
  variantId = "30000000-0000-0000-0000-000000000001";
  draftId = "20000000-0000-0000-0000-000000000002";
});

describe("RLS público", () => {
  it("anon vê só produtos publicados e não vê pedidos/cupons/clientes", async () => {
    await as(db, "anon", null, async () => {
      const p = await db.query("select slug from public.products");
      expect(p.rows).toEqual([{ slug: "camiseta-demo" }]);
      await expect(db.query("select * from public.orders")).rejects.toThrow(/permission denied/);
      await expect(db.query("select * from public.coupons")).rejects.toThrow(/permission denied/);
      await expect(db.query("select * from public.customers")).rejects.toThrow(/permission denied/);
      await expect(db.query("insert into public.products (name, slug, base_price_cents) values ('x1','x1',1)")).rejects.toThrow();
    });
  });
  it("anon não executa create_order nem funções administrativas", async () => {
    await as(db, "anon", null, async () => {
      await expect(db.query("select * from public.create_order('{}'::jsonb)")).rejects.toThrow(/permission denied/);
      await expect(db.query("select public.admin_dashboard(now() - interval '1 day', now())")).rejects.toThrow(/permission denied/);
    });
  });
  it("variantes de produto em rascunho não são públicas", async () => {
    await as(db, "anon", null, async () => {
      const v = await db.query("select id from public.product_variants");
      expect(v.rows).toHaveLength(1);
    });
  });
});

describe("Controle de acesso por função", () => {
  it("usuário autenticado sem perfil não administra nada", async () => {
    await as(db, "authenticated", NOBODY, async () => {
      await expect(db.query("update public.products set name = 'hack' where id = $1", [productId]).then((r) => r.affectedRows)).resolves.toBe(0);
      const o = await db.query("select * from public.orders");
      expect(o.rows).toHaveLength(0);
      await expect(db.query("select public.admin_adjust_stock($1, 5, 'entry', 'teste ok')", [variantId])).rejects.toThrow(/FORBIDDEN/);
    });
  });
  it("não é possível se autopromover a admin", async () => {
    await as(db, "authenticated", EDITOR, async () => {
      const r = await db.query("update public.profiles set role = 'admin' where id = $1", [EDITOR]);
      expect(r.affectedRows).toBe(0);
      await expect(db.query("insert into public.profiles (id, role) values ($1, 'admin')", [NOBODY])).rejects.toThrow();
    });
  });
  it("editor não vê pedidos nem altera estoque", async () => {
    await as(db, "authenticated", EDITOR, async () => {
      expect((await db.query("select * from public.orders")).rows).toHaveLength(0);
      await expect(db.query("select public.admin_adjust_stock($1, 5, 'entry', 'teste ok')", [variantId])).rejects.toThrow(/FORBIDDEN/);
      const upd = db.query("update public.product_variants set stock_quantity = 999 where id = $1", [variantId]);
      await expect(upd).rejects.toThrow(/STOCK_WRITE_FORBIDDEN/);
    });
  });
});

describe("Estoque", () => {
  it("entrada registra histórico imutável e bloqueia saldo negativo", async () => {
    await as(db, "authenticated", MANAGER, async () => {
      const r = await db.query<{ admin_adjust_stock: number }>("select public.admin_adjust_stock($1, 10, 'entry', 'Carga inicial')", [variantId]);
      expect(r.rows[0]!.admin_adjust_stock).toBe(10);
      await expect(db.query("select public.admin_adjust_stock($1, -50, 'exit', 'Perda')", [variantId])).rejects.toThrow(/OUT_OF_STOCK/);
      await expect(db.query("select public.admin_adjust_stock($1, 1, 'exit', 'Perda')", [variantId])).rejects.toThrow(/INVALID_QUANTITY/);
      await expect(db.query("select public.admin_adjust_stock($1, 1, 'entry', '')", [variantId])).rejects.toThrow(/INVALID_REASON/);
      await expect(db.query("delete from public.inventory_movements")).rejects.toThrow();
    });
    await expect(db.query("update public.inventory_movements set reason = 'x123'")).rejects.toThrow(/imutável/);
  });
});

describe("Pedidos", () => {
  it("cria pedido pending_contact com snapshot de preço e histórico", async () => {
    const r = await createOrder(orderPayload());
    expect(r.order_number).toMatch(/^LF-[0-9A-F]{8}$/);
    const o = (await db.query<any>("select * from public.orders where id = $1", [r.order_id])).rows[0];
    expect(o).toMatchObject({ status: "pending_contact", subtotal_cents: 17980, grand_total_cents: 17980, stock_committed: false });
    const items = (await db.query<any>("select * from public.order_items where order_id = $1", [r.order_id])).rows;
    expect(items[0]).toMatchObject({ product_name_snapshot: "Camiseta Demo", unit_price_cents: 8990, line_total_cents: 17980, size_snapshot: "M" });
    expect((await db.query("select * from public.order_status_history where order_id = $1", [r.order_id])).rows).toHaveLength(1);
    // criar pedido NÃO mexe no estoque
    expect((await db.query<any>("select stock_quantity from public.product_variants where id = $1", [variantId])).rows[0].stock_quantity).toBe(10);
  });
  it("é idempotente (pedido duplicado)", async () => {
    const p = orderPayload();
    const a = await createOrder(p); const b = await createOrder(p);
    expect(b.order_id).toBe(a.order_id); expect(b.deduplicated).toBe(true);
  });
  it("rejeita preço adulterado, estoque insuficiente, variante inexistente e produto não publicado", async () => {
    await expect(createOrder(orderPayload({ items: [{ variant_id: variantId, quantity: 1, unit_price_cents: 1 }] }))).rejects.toThrow(/PRICE_CHANGED/);
    await expect(createOrder(orderPayload({ items: [{ variant_id: variantId, quantity: 11, unit_price_cents: 8990 }] }))).rejects.toThrow(/OUT_OF_STOCK/);
    await expect(createOrder(orderPayload({ items: [{ variant_id: "30000000-0000-0000-0000-0000000000ff", quantity: 1, unit_price_cents: 1 }] }))).rejects.toThrow(/VARIANT_UNAVAILABLE/);
    await expect(createOrder(orderPayload({ items: [{ variant_id: "30000000-0000-0000-0000-000000000002", quantity: 1, unit_price_cents: 5000 }] }))).rejects.toThrow(/VARIANT_UNAVAILABLE/);
    await expect(createOrder(orderPayload({ items: [] }))).rejects.toThrow(/EMPTY_CART/);
    await expect(createOrder(orderPayload({ discount_cents: 100 }))).rejects.toThrow(/DISCOUNT_WITHOUT_COUPON/);
  });
  it("valida cupom no banco (expirado e limite)", async () => {
    await db.exec(`insert into public.coupons (id, code, discount_type, discount_value, expires_at) values ('40000000-0000-0000-0000-000000000001','OLD10','percent',10, now() - interval '1 day');
      insert into public.coupons (id, code, discount_type, discount_value, usage_limit) values ('40000000-0000-0000-0000-000000000002','ONCE','fixed',500, 1);`);
    await expect(createOrder(orderPayload({ coupon_id: "40000000-0000-0000-0000-000000000001", discount_cents: 1798 }))).rejects.toThrow(/COUPON_INVALID/);
    const ok = await createOrder(orderPayload({ coupon_id: "40000000-0000-0000-0000-000000000002", discount_cents: 500 }));
    const o = (await db.query<any>("select discount_total_cents, grand_total_cents, coupon_code_snapshot from public.orders where id=$1", [ok.order_id])).rows[0];
    expect(o).toEqual({ discount_total_cents: 500, grand_total_cents: 17480, coupon_code_snapshot: "ONCE" });
    await expect(createOrder(orderPayload({ coupon_id: "40000000-0000-0000-0000-000000000002", discount_cents: 500 }))).rejects.toThrow(/COUPON_INVALID/);
  });
  it("pedido de visitante só é lido por equipe autorizada", async () => {
    await as(db, "authenticated", EDITOR, async () => expect((await db.query("select 1 from public.orders")).rows).toHaveLength(0));
    await as(db, "authenticated", MANAGER, async () => expect((await db.query("select 1 from public.orders")).rows.length).toBeGreaterThan(0));
  });
});

describe("Status do pedido e estoque", () => {
  it("confirmar baixa estoque uma vez; cancelar devolve; transições inválidas falham", async () => {
    const o = await createOrder(orderPayload());
    const stock = async () => (await db.query<any>("select stock_quantity from public.product_variants where id = $1", [variantId])).rows[0].stock_quantity as number;
    const before = await stock();
    await as(db, "authenticated", MANAGER, async () => {
      await expect(db.query("update public.orders set status = 'delivered' where id = $1", [o.order_id])).rejects.toThrow(/STATUS_WRITE_FORBIDDEN/);
      await expect(db.query("select public.admin_set_order_status($1, 'shipped')", [o.order_id])).rejects.toThrow(/INVALID_TRANSITION/);
      await db.query("select public.admin_set_order_status($1, 'confirmed', 'ok')", [o.order_id]);
      await expect(db.query("select public.admin_set_order_status($1, 'confirmed')", [o.order_id])).rejects.toThrow(/INVALID_TRANSITION/);
    });
    expect(await stock()).toBe(before - 2);
    await as(db, "authenticated", MANAGER, async () => { await db.query("select public.admin_set_order_status($1, 'cancelled', 'cliente desistiu')", [o.order_id]); });
    expect(await stock()).toBe(before);
    await as(db, "authenticated", MANAGER, async () => {
      await expect(db.query("select public.admin_set_order_status($1, 'confirmed')", [o.order_id])).rejects.toThrow(/INVALID_TRANSITION/);
    });
    expect(await stock()).toBe(before);
    const hist = (await db.query<any>("select new_status from public.order_status_history where order_id = $1 order by created_at, id", [o.order_id])).rows;
    expect(hist.map((h) => h.new_status)).toEqual(["pending_contact", "confirmed", "cancelled"]);
  });
  it("cancelar pedido nunca confirmado não mexe no estoque", async () => {
    const o = await createOrder(orderPayload());
    const mv = async () => Number((await db.query<any>("select count(*)::int c from public.inventory_movements")).rows[0].c);
    const before = await mv();
    await as(db, "authenticated", ADMIN, async () => { await db.query("select public.admin_set_order_status($1, 'cancelled')", [o.order_id]); });
    expect(await mv()).toBe(before);
  });
  it("confirmação falha atomicamente sem estoque suficiente", async () => {
    const o = await createOrder(orderPayload({ items: [{ variant_id: variantId, quantity: 3, unit_price_cents: 8990 }] }));
    await db.exec("set app.stock_write = '1'; update public.product_variants set stock_quantity = 1; reset app.stock_write;");
    await as(db, "authenticated", MANAGER, async () => {
      await expect(db.query("select public.admin_set_order_status($1, 'confirmed')", [o.order_id])).rejects.toThrow(/OUT_OF_STOCK/);
    });
    expect((await db.query<any>("select status from public.orders where id=$1", [o.order_id])).rows[0].status).toBe("pending_contact");
  });
});

describe("Dashboard", () => {
  it("separa criados, confirmados e recebidos", async () => {
    await as(db, "authenticated", MANAGER, async () => {
      const r = (await db.query<{ admin_dashboard: any }>("select public.admin_dashboard(now() - interval '1 day', now() + interval '1 day')")).rows[0]!.admin_dashboard;
      expect(r.orders_total).toBeGreaterThan(0);
      expect(r.confirmed_value_cents).toBe(0);
      expect(r.received_value_cents).toBe(0);
      expect(r.created_value_cents).toBeGreaterThan(0);
    });
  });
});
