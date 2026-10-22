/* ===== utilidades ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const brl = (c) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const dtf = (iso) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const mark = (cls = "", w = 36) => `<svg class="${cls}" width="${w}" height="${w}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><g class="${cls.includes("spin") ? "spin" : ""}"><ellipse cx="32" cy="32" rx="25" ry="11" transform="rotate(45 32 32)" stroke="#a5c910" stroke-width="7"/><ellipse cx="32" cy="32" rx="25" ry="11" transform="rotate(-45 32 32)" stroke="#a5c910" stroke-width="7" opacity=".92"/></g><g fill="#a5c910"><path d="M32 2l1.8 3.4L37 7l-3.2 1.7L32 12l-1.8-3.3L27 7l3.2-1.6z"/><path d="M32 52l1.8 3.4L37 57l-3.2 1.7L32 62l-1.8-3.3L27 57l3.2-1.6z"/></g></svg>`;

/* Code 39 (mesmo algoritmo do sistema real) */
const C39 = { 0: "nnnwwnwnn", 1: "wnnwnnnnw", 2: "nnwwnnnnw", 3: "wnwwnnnnn", 4: "nnnwwnnnw", 5: "wnnwwnnnn", 6: "nnwwwnnnn", 7: "nnnwnnwnw", 8: "wnnwnnwnn", 9: "nnwwnnwnn", A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn", K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn", P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn", U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn", "-": "nwnnnnwnw", "*": "nwnnwnwnn" };
function barcode(text) {
  let x = 0, bars = "";
  [..."*" + text.toUpperCase() + "*"].forEach((ch, ci, a) => {
    [...C39[ch]].forEach((el, i) => { const w = el === "w" ? 3 : 1; if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="60" fill="#111"/>`; x += w; });
    if (ci < a.length - 1) x += 1;
  });
  return `<svg viewBox="0 0 ${x} 60" preserveAspectRatio="none" style="display:block;margin:14px auto 0;height:64px;width:100%;max-width:256px" role="img" aria-label="Código de barras ${text}">${bars}</svg>`;
}

/* ===== dados de demonstração ===== */
const STATUS = { pending_contact: "Aguardando contato", awaiting_confirmation: "Aguardando confirmação", confirmed: "Confirmado", processing: "Em preparação", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado" };
const NEXT = { pending_contact: ["awaiting_confirmation", "confirmed", "cancelled"], awaiting_confirmation: ["confirmed", "cancelled"], confirmed: ["processing", "cancelled"], processing: ["shipped", "cancelled"], shipped: ["delivered", "cancelled"], delivered: [], cancelled: [] };
const CONF = ["confirmed", "processing", "shipped", "delivered"];
const CATS = [["roupas-masculinas", "Roupas masculinas"], ["roupas-femininas", "Roupas femininas"], ["camisetas-e-regatas", "Camisetas e regatas"], ["leggings-e-shorts", "Leggings e shorts"], ["tenis-esportivos", "Tênis esportivos"], ["luvas-e-munhequeiras", "Luvas e munhequeiras"], ["garrafas-e-acessorios", "Garrafas e acessórios"], ["equipamentos-de-treino", "Equipamentos de treino"]];

function mkVariants(sku, sizes, colors, stocks) {
  const out = []; let n = 0;
  (sizes.length ? sizes : [null]).forEach((s) => (colors.length ? colors : [null]).forEach((c) => { out.push({ id: sku + "-" + ++n, sku: `${sku.toUpperCase()}-${n}`, size: s, color: c, stock: stocks[(n - 1) % stocks.length] }); }));
  return out;
}
function seed() {
  const P = (id, name, cat, price, sale, img, badge, featured, sizes, colors, stocks, desc) => ({ id, slug: id, name, cat, price, sale, img, badge, featured, published: true, desc, variants: mkVariants(id, sizes, colors, stocks) });
  const products = [
    P("camiseta-dry-fit", "Camiseta Dry Fit", "roupas-masculinas", 8990, null, "camiseta", "Novo", true, ["P", "M", "G", "GG"], ["Preto", "Branco"], [10, 8, 3, 0, 12, 9, 6, 4], "Camiseta leve para treinar com conforto. Produto de demonstração."),
    P("regata-treino", "Regata Treino", "camisetas-e-regatas", 6990, 5490, "regata", null, false, ["P", "M", "G"], ["Verde-limão"], [9, 7, 5], "Regata de treino com caimento solto. Produto de demonstração."),
    P("legging-cintura-alta", "Legging Cintura Alta", "leggings-e-shorts", 12990, 9990, "legging", null, true, ["P", "M", "G"], ["Grafite"], [8, 2, 10], "Legging com cós alto e acabamento confortável. Produto de demonstração."),
    P("short-de-treino", "Short de Treino", "roupas-masculinas", 7990, null, "short", null, false, ["M", "G", "GG"], ["Preto"], [10, 10, 0], "Short leve para treinos. Produto de demonstração."),
    P("tenis-de-corrida", "Tênis de Corrida", "tenis-esportivos", 34990, null, "tenis", "Lançamento", true, ["38", "39", "40", "41", "42"], ["Laranja"], [5, 6, 3, 0, 4], "Tênis para corrida e treino. Produto de demonstração."),
    P("luvas-de-treino", "Luvas de Treino", "luvas-e-munhequeiras", 4990, null, "luva", null, false, ["P", "M", "G"], ["Grafite"], [10, 10, 7], "Luvas para proteger as mãos no treino. Produto de demonstração."),
    P("garrafa-750ml", "Garrafa 750 ml", "garrafas-e-acessorios", 3990, null, "garrafa", null, false, [], [], [25], "Garrafa para levar a hidratação para o treino. Produto de demonstração."),
    P("halter-ajustavel", "Halter Ajustável", "equipamentos-de-treino", 19990, null, "halter", null, false, [], [], [6], "Halter ajustável para treinar em casa. Produto de demonstração."),
  ];
  const now = Date.now(), day = 86400000;
  const S = {
    v: 1, products,
    settings: { name: "Ana Fitness", whatsapp: "", promoOn: true, promoText: "Demonstração: produtos, preços e imagens são ilustrativos ✦ Frete e pagamento combinados pelo WhatsApp", freeShip: null, lowStock: 5 },
    coupons: [{ code: "ANA10", type: "percent", value: 10, min: 0, limit: null, used: 2, expires: null, active: true }, { code: "BEMVINDA", type: "fixed", value: 1500, min: 10000, limit: 50, used: 1, expires: null, active: true }, { code: "VERAO", type: "percent", value: 20, min: 0, limit: null, used: 0, expires: new Date(now - day).toISOString(), active: true }],
    banners: [{ id: "b1", title: "Coleção Treino de Verão", sub: "Peças leves para acompanhar a sua rotina.", btn: "Ver produtos", active: true }],
    orders: [], moves: [], cart: [], favs: [], seq: 1000, ui: {},
  };
  const mkOrder = (name, phone, items, status, ageDays, paid, coupon) => {
    const its = items.map(([pid, vid, qty]) => { const p = products.find((x) => x.id === pid), v = p.variants.find((x) => x.id === vid); return { pid, vid, name: p.name, size: v.size, color: v.color, qty, unit: p.sale ?? p.price }; });
    const sub = its.reduce((s, i) => s + i.unit * i.qty, 0), disc = coupon ? Math.floor(sub * 0.1) : 0;
    const created = new Date(now - ageDays * day).toISOString();
    const o = { id: uid(), number: "LF-" + (S.seq++).toString(36).toUpperCase().padStart(4, "0") + uid().slice(0, 4).toUpperCase(), name, phone, items: its, subtotal: sub, discount: disc, coupon: coupon || null, shipping: null, total: sub - disc, status, committed: false, paid: paid ? new Date(now - (ageDays - 0.2) * day).toISOString() : null, created, history: [{ from: null, to: "pending_contact", at: created, note: "Pedido registrado pelo site" }] };
    if (status !== "pending_contact") o.history.push({ from: "pending_contact", to: status, at: new Date(now - (ageDays - 0.1) * day).toISOString(), note: "" });
    if (CONF.includes(status)) o.committed = true;
    return o;
  };
  S.orders = [
    mkOrder("Mariana Souza", "11988887777", [["camiseta-dry-fit", "camiseta-dry-fit-1", 2], ["garrafa-750ml", "garrafa-750ml-1", 1]], "delivered", 12, true),
    mkOrder("Carla Mendes", "21977776666", [["legging-cintura-alta", "legging-cintura-alta-1", 1]], "shipped", 6, true, "ANA10"),
    mkOrder("Bruno Lima", "31966665555", [["tenis-de-corrida", "tenis-de-corrida-1", 1]], "confirmed", 3, false),
    mkOrder("Juliana Rocha", "", [["regata-treino", "regata-treino-2", 2], ["luvas-de-treino", "luvas-de-treino-1", 1]], "awaiting_confirmation", 1, false),
    mkOrder("Paulo Alves", "41955554444", [["short-de-treino", "short-de-treino-1", 1]], "pending_contact", 0.2, false),
    mkOrder("Renata Dias", "85944443333", [["halter-ajustavel", "halter-ajustavel-1", 1]], "cancelled", 9, false),
  ];
  return S;
}
const KEY = "ana_demo_v1";
let S = (() => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch {} return seed(); })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

/* ===== regras (espelham o sistema real) ===== */
const saleOn = (p) => p.sale != null && p.sale < p.price;
const price = (p) => (saleOn(p) ? p.sale : p.price);
const stockOf = (p) => p.variants.reduce((s, v) => s + v.stock, 0);
const sizes = (p) => [...new Set(p.variants.map((v) => v.size).filter(Boolean))];
const colors = (p) => [...new Set(p.variants.map((v) => v.color).filter(Boolean))];
const findV = (p, s, c) => p.variants.find((v) => (v.size || null) === (s || null) && (v.color || null) === (c || null));
const getP = (id) => S.products.find((p) => p.id === id);
function couponCalc(code, lines) {
  const c = S.coupons.find((x) => x.code === String(code).trim().toUpperCase());
  if (!c || !c.active) return { err: "Cupom inválido." };
  if (c.expires && new Date(c.expires) <= new Date()) return { err: "Este cupom expirou." };
  if (c.limit != null && c.used >= c.limit) return { err: "Este cupom atingiu o limite de usos." };
  const sub = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  if (sub < c.min) return { err: `Pedido mínimo de ${brl(c.min)} para este cupom.` };
  const d = c.type === "percent" ? Math.floor((sub * c.value) / 100) : Math.min(c.value, sub);
  return { c, discount: Math.min(d, sub) };
}
function quote() {
  const lines = S.cart.map((l) => { const p = getP(l.pid), v = p && p.variants.find((x) => x.id === l.vid); if (!p || !v || !p.published) return { ...l, name: p ? p.name : "Indisponível", unit: 0, problem: "Este produto não está mais disponível." }; const prob = v.stock <= 0 ? "Sem estoque no momento." : l.qty > v.stock ? `Quantidade acima do estoque (disponível: ${v.stock}).` : null; return { ...l, name: p.name, size: v.size, color: v.color, unit: price(p), img: p.img, slug: p.slug, stock: v.stock, problem: prob }; });
  let discount = 0, couponMsg = null, coupon = null;
  if (S.ui.coupon) { const r = couponCalc(S.ui.coupon, lines.filter((l) => !l.problem)); if (r.err) couponMsg = { e: true, t: r.err }; else { discount = r.discount; coupon = r.c.code; couponMsg = { e: false, t: "Cupom aplicado. O desconto é confirmado no atendimento." }; } }
  const sub = lines.filter((l) => !l.problem).reduce((s, l) => s + l.unit * l.qty, 0);
  const ship = S.settings.freeShip && sub - discount >= S.settings.freeShip ? 0 : null;
  return { lines, sub, discount, coupon, couponMsg, ship, total: sub - discount, blocked: lines.some((l) => l.problem) };
}
function setStatus(o, to, note) {
  if (!NEXT[o.status].includes(to)) return "Esta mudança de status não é permitida.";
  if (to === "confirmed" && !o.committed) {
    for (const it of o.items) { const v = getP(it.pid)?.variants.find((x) => x.id === it.vid); if (!v || v.stock < it.qty) return "Estoque insuficiente para confirmar este pedido."; }
    for (const it of o.items) { const v = getP(it.pid).variants.find((x) => x.id === it.vid); v.stock -= it.qty; S.moves.unshift({ at: new Date().toISOString(), pid: it.pid, vid: it.vid, type: "Baixa por pedido", delta: -it.qty, after: v.stock, reason: `Pedido ${o.number} confirmado` }); }
    o.committed = true;
  } else if (to === "cancelled") {
    if (o.committed) { for (const it of o.items) { const v = getP(it.pid)?.variants.find((x) => x.id === it.vid); if (v) { v.stock += it.qty; S.moves.unshift({ at: new Date().toISOString(), pid: it.pid, vid: it.vid, type: "Devolução (cancelamento)", delta: it.qty, after: v.stock, reason: `Pedido ${o.number} cancelado` }); } } o.committed = false; }
    if (o.coupon) { const c = S.coupons.find((x) => x.code === o.coupon); if (c && c.used > 0) c.used--; }
  }
  o.history.push({ from: o.status, to, at: new Date().toISOString(), note: note || "" });
  o.status = to; return null;
}
function waLink(o) {
  const n = S.settings.whatsapp.replace(/\D/g, ""); if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(waText(o))}`;
}
function waText(o) {
  const lines = o.items.map((i) => `• ${i.qty}x ${i.name}${i.size || i.color ? ` (${[i.size && "Tam " + i.size, i.color].filter(Boolean).join(", ")})` : ""} — ${brl(i.unit * i.qty)}`);
  const out = [`Olá! Gostaria de finalizar meu pedido na ${S.settings.name}.`, `Pedido: ${o.number}`, "Produtos:", ...lines, `Subtotal: ${brl(o.subtotal)}`];
  if (o.discount) out.push(`Descontos: ${brl(o.discount)} (cupom ${o.coupon})`);
  out.push(`Frete: ${o.shipping == null ? "a confirmar" : o.shipping === 0 ? "grátis" : brl(o.shipping)}`, `Total estimado: ${brl(o.total)}${o.shipping == null ? " (sem frete)" : ""}`, `Nome: ${o.name}`, "Gostaria de confirmar a disponibilidade, o frete e as condições de pagamento.");
  return out.join("\n");
}

/* ===== roteamento ===== */
const route = () => (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
const go = (h) => { location.hash = "#/" + h; };
const isAdmin = () => route()[0] === "admin";
let toastT;
function toast(msg) { $$(".toast").forEach((t) => t.remove()); const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2600); }
function modal(html) { closeModal(); const m = document.createElement("div"); m.className = "modal"; m.id = "modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.innerHTML = `<div class="box">${html}</div>`; m.addEventListener("click", (e) => { if (e.target === m) closeModal(); }); document.body.appendChild(m); const f = m.querySelector("input,select,textarea,button"); f && f.focus(); }
function closeModal() { $("#modal")?.remove(); }
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); $(".drawer")?.remove(); } });

/* ===== LOJA ===== */
function promoBar() { return S.settings.promoOn && S.settings.promoText ? `<div class="promo">${esc(S.settings.promoText)}</div>` : ""; }
function header() {
  const count = S.cart.reduce((s, l) => s + l.qty, 0);
  return `${promoBar()}<header class="hdr dark"><div class="in">
    <div class="hl"><button class="ic burger" data-a="menu" aria-label="Abrir menu">☰</button><nav aria-label="Principal"><a href="#/produtos">Produtos</a><a href="#/produtos" data-a="cat" data-c="tenis-esportivos">Tênis</a><a href="#/produtos" data-a="cat" data-c="leggings-e-shorts">Leggings</a></nav></div>
    <a class="brand" href="#/" aria-label="${esc(S.settings.name)} — início">${mark("", 34)}<span>${esc(S.settings.name)}</span></a>
    <div class="hr"><button class="ic" data-a="search" aria-label="Buscar">⌕</button><a class="ic" href="#/favoritos" aria-label="Favoritos" style="text-decoration:none">♡</a><a class="ic cart" href="#/carrinho" aria-label="Carrinho, ${count} itens" style="text-decoration:none">🛍${count ? `<span class="badge">${count}</span>` : ""}</a></div>
  </div></header>`;
}
function footer() {
  return `<footer class="foot dark"><div class="wrap fg">
    <div><img src="${LOGO}" alt="${esc(S.settings.name)}" width="120" height="120" style="border-radius:32px"><p class="small" style="opacity:.75;max-width:260px;margin-top:12px">Roupas, acessórios e equipamentos para o seu treino.</p></div>
    <div><h4>Loja</h4><a href="#/produtos">Todos os produtos</a>${CATS.slice(2, 6).map(([s, n]) => `<a data-a="cat" data-c="${s}" href="#/produtos">${n}</a>`).join("")}</div>
    <div><h4>Informações</h4><a data-a="policy" data-p="trocas">Trocas e devoluções</a><a data-a="policy" data-p="gestao">Política de gestão</a><a data-a="policy" data-p="privacidade">Política de privacidade</a><a data-a="policy" data-p="termos">Termos de uso</a></div>
    <div><h4>Atendimento</h4><a data-a="policy" data-p="contato">WhatsApp e contato</a><p class="small" style="opacity:.6">Os dados comerciais (endereço, e-mail, redes) são preenchidos pela loja no painel.</p></div>
  </div><div class="wrap small" style="text-align:center;opacity:.55;margin-top:32px">© ${new Date().getFullYear()} ${esc(S.settings.name)} — demonstração</div></footer>`;
}
const POL = {
  gestao: ["Política de Gestão", "Como gerenciamos pedidos\nTodo pedido feito no site é registrado com número único e fica “aguardando contato” até a nossa equipe falar com você pelo WhatsApp. Só depois da confirmação de disponibilidade, frete e pagamento o pedido passa a “confirmado”. Registrar o pedido não significa pagamento nem venda concluída.\n\nComo gerenciamos o estoque\nO estoque é reservado somente quando o pedido é confirmado. Se um pedido confirmado for cancelado, as unidades voltam ao estoque. Toda alteração fica registrada com data, motivo e responsável.\n\nPreços, promoções e cupons\nOs valores são conferidos pelo sistema no momento do pedido. Promoções e cupons seguem regras e validade de cada campanha e são confirmados no atendimento.\n\nAcesso e proteção dos dados\nSomente a equipe autorizada acessa pedidos e dados de clientes, com permissões por função (administrador, gerente e editor)."],
  privacidade: ["Política de Privacidade", "Coletamos apenas o nome e, de forma opcional, telefone e observações para atender o seu pedido. Não coletamos dados de cartão ou pagamento no site. O carrinho e os favoritos ficam no seu navegador.\n\n(Texto-modelo de demonstração: deve ser revisado por um profissional antes do lançamento.)"],
  termos: ["Termos de Uso", "O registro do pedido no site não representa pagamento nem confirmação de venda. A venda é concluída após a confirmação de disponibilidade, frete e pagamento pelo WhatsApp.\n\n(Texto-modelo de demonstração.)"],
  trocas: ["Trocas e Devoluções", "Em compras à distância, o consumidor pode desistir da compra em até 7 dias corridos após o recebimento (art. 49 do CDC). Para solicitar troca ou devolução, fale com a loja informando o número do pedido.\n\n(Texto-modelo de demonstração: a loja define as condições reais.)"],
  contato: ["Contato", "O atendimento é feito pelo WhatsApp. O número é configurado pela loja no painel administrativo."],
};
function card(p, i = 0) {
  const sz = sizes(p), cl = colors(p), st = stockOf(p), pr = price(p), pct = saleOn(p) ? Math.round(((p.price - p.sale) / p.price) * 100) : 0;
  const single = !sz.length && !cl.length && p.variants[0].stock > 0;
  const fav = S.favs.includes(p.id);
  return `<article class="pc rv" style="--i:${i % 4}"><a class="im lift" href="#/produto/${p.slug}" aria-label="Ver ${esc(p.name)}"><img src="${IMG[p.img]}" alt="${esc(p.name)} (imagem demonstrativa)" loading="lazy"><span class="tags">${pct ? `<span class="tag d">-${pct}%</span>` : ""}${p.badge ? `<span class="tag">${esc(p.badge)}</span>` : ""}${!st ? `<span class="tag x">Indisponível</span>` : ""}</span></a>
  <button class="fav ${fav ? "on" : ""}" data-a="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="${fav ? "Remover dos" : "Adicionar aos"} favoritos">${fav ? "♥" : "♡"}</button>
  <h3><a href="#/produto/${p.slug}" style="text-decoration:none">${esc(p.name)}</a></h3>
  <div><span class="price">${brl(pr)}</span>${saleOn(p) ? `<span class="old">${brl(p.price)}</span>` : ""}</div>
  ${sz.length || cl.length ? `<div class="small muted" style="margin-top:4px">${sz.length ? "Tam: " + sz.join(" · ") : ""}${sz.length && cl.length ? " | " : ""}${cl.length ? cl.length + (cl.length > 1 ? " cores" : " cor") : ""}</div>` : ""}
  ${st > 0 && st <= S.settings.lowStock ? `<div class="small" style="color:var(--brand-strong);font-weight:700;margin-top:4px">Últimas unidades</div>` : ""}
  <div class="acts"><a class="btn o" href="#/produto/${p.slug}">Ver</a>${single ? `<button class="btn p" data-a="quick" data-id="${p.id}">Comprar</button>` : st ? `<a class="btn p" href="#/produto/${p.slug}">Escolher</a>` : `<span class="btn" style="background:#e5e7eb;color:#6b7280;cursor:default">Esgotado</span>`}</div></article>`;
}
function home() {
  const pub = S.products.filter((p) => p.published), feat = pub.filter((p) => p.featured), show = (feat.length ? feat : pub).slice(0, 8);
  const cats = CATS.map(([s, n]) => [s, n, pub.filter((p) => p.cat === s).length]).filter((c) => c[2]);
  const ban = S.banners.find((b) => b.active);
  return `${header()}
  <section class="hero dark" aria-labelledby="ht"><div class="box">
    <div class="blob float" style="right:-90px;top:-90px;width:420px;height:420px;background:rgba(165,201,16,.3)"></div><div class="blob" style="left:25%;bottom:-120px;width:300px;height:300px;background:rgba(228,245,138,.18)"></div>
    <div><span class="eyebrow rise" style="color:var(--ink)">✦ ${esc(S.settings.name)}</span><h1 id="ht" class="rise" style="--i:1">Seu próximo nível começa aqui.</h1>
    <p class="sub rise" style="--i:2">Roupas, acessórios e equipamentos para acompanhar cada treino, superar limites e transformar sua rotina.</p>
    <div class="cta rise" style="--i:3"><a class="btn p lg" href="#/produtos">COMPRAR AGORA →</a><a class="btn g lg" href="#/produtos" data-a="sort" data-s="novidades">EXPLORAR COLEÇÃO</a></div></div>
    <div class="brandcard float" aria-hidden="true">${mark("spin", 170)}<span class="chip" style="left:-24px;top:36px;background:var(--brand);color:var(--ink)">Treino ✦ Rotina</span><span class="chip" style="right:-24px;bottom:44px;background:#fff;color:var(--ink)">Compra pelo WhatsApp</span></div>
  </div></section>
  <div class="marq dark" aria-hidden="true"><div class="t">${[0, 1].map(() => `<span class="i">${Array.from({ length: 6 }, (_, i) => `<span style="${i % 2 ? "color:var(--brand)" : "-webkit-text-stroke:2px #fff;color:transparent"}">${esc(S.settings.name)}</span>${mark("", 52)}`).join("")}</span>`).join("")}</div></div>
  <section class="s wrap"><div class="sh rv"><div><span class="eyebrow">Navegue</span><h2 class="h2">Escolha seu treino</h2></div><a class="btn o s" href="#/produtos" style="display:inline-flex">Ver todos →</a></div>
  <ul class="cats">${cats.map(([s, n, c], i) => `<li class="rv" style="--i:${i % 4}"><a class="cat dark" href="#/produtos" data-a="cat" data-c="${s}">${mark("mk", 150)}<span class="arrow">↗</span><b>${n}</b><small>${c} ${c > 1 ? "produtos" : "produto"}</small></a></li>`).join("")}</ul></section>
  <section class="s wrap"><div class="sh rv"><div><span class="eyebrow">${feat.length ? "Seleção da loja" : "Recém-chegados"}</span><h2 class="h2">${feat.length ? "Em destaque" : "Novidades"}</h2></div><a class="btn o s" href="#/produtos">Ver tudo →</a></div>
  ${show.length ? `<div class="grid">${show.map(card).join("")}</div>` : `<div class="empty"><h3 class="h2" style="font-size:30px">Em breve, novos produtos</h3></div>`}</section>
  ${ban ? `<section class="s wrap rv"><div class="banner"><div style="position:absolute;right:-30px;top:-30px;opacity:.25;z-index:-1" class="float">${mark("", 300)}</div><div style="max-width:560px"><h2 class="h2">${esc(ban.title)}</h2><p style="font-size:18px;margin:14px 0 0">${esc(ban.sub)}</p>${ban.btn ? `<a class="btn k lg" href="#/produtos" style="margin-top:26px">${esc(ban.btn)} →</a>` : ""}</div></div></section>` : ""}
  <section class="s"><div class="bubble"><div class="bgrid">${[["✔", "Compra simples", "Escolha os produtos e finalize em poucos toques."], ["✆", "Atendimento pelo WhatsApp", "Confirmamos disponibilidade, frete e pagamento com você."], ["♡", "Trocas e devoluções", "Consulte a política da loja antes de comprar."], ["✦", "Transparência", "Valores conferidos pelo sistema no pedido."]].map((b, i) => `<div class="rv lift" style="--i:${i}"><span class="ico">${b[0]}</span><h3 style="font-size:20px;margin-top:18px">${b[1]}</h3><p class="small muted" style="margin:6px 0 0">${b[2]}</p></div>`).join("")}</div></div></section>
  <section class="s wrap edit2">${[["VISTA SUA EVOLUÇÃO.", "Peças pensadas para acompanhar o seu treino.", "background:var(--ink);color:#fff"], ["EQUIPAMENTO CERTO. FOCO TOTAL.", "Acessórios e equipamentos para a sua rotina.", "background:var(--brand);color:var(--ink)"]].map((b, i) => `<a href="#/produtos" class="eb lift rv dark" style="${b[2]};text-decoration:none;--i:${i}"><div style="position:absolute;right:-30px;top:-30px;opacity:.28;z-index:-1" class="${i ? "" : "float"}">${mark("", 240)}</div><h2 class="h2">${b[0]}</h2><p style="max-width:380px;opacity:.85">${b[1]}</p><span class="btn w s" style="width:fit-content;margin-top:10px">Ver mais →</span></a>`).join("")}</section>
  ${footer()}`;
}
function catalog() {
  const f = S.ui.f || (S.ui.f = { q: "", cat: "", sizes: [], colors: [], min: "", max: "", stock: false, sort: "novidades" });
  const pub = S.products.filter((p) => p.published);
  const allSizes = [...new Set(pub.flatMap(sizes))], allColors = [...new Set(pub.flatMap(colors))];
  const min = parseFloat(String(f.min).replace(",", ".")) * 100, max = parseFloat(String(f.max).replace(",", ".")) * 100;
  let list = pub.filter((p) => {
    if (f.cat && p.cat !== f.cat) return false;
    if (f.q && !norm(p.name + " " + p.desc).includes(norm(f.q))) return false;
    if ((f.sizes.length || f.colors.length || f.stock) && !p.variants.some((v) => (!f.sizes.length || f.sizes.includes(v.size)) && (!f.colors.length || f.colors.includes(v.color)) && (!f.stock || v.stock > 0))) return false;
    if (!isNaN(min) && price(p) < min) return false; if (!isNaN(max) && price(p) > max) return false; return true;
  });
  list.sort((a, b) => f.sort === "preco-asc" ? price(a) - price(b) : f.sort === "preco-desc" ? price(b) - price(a) : f.sort === "nome" ? a.name.localeCompare(b.name) : S.products.indexOf(a) - S.products.indexOf(b));
  const active = f.q || f.cat || f.sizes.length || f.colors.length || f.min || f.max || f.stock;
  const title = f.cat ? CATS.find((c) => c[0] === f.cat)[1] : f.q ? `Resultados para “${esc(f.q)}”` : "Todos os produtos";
  return `${header()}<div class="wrap" style="padding-top:34px"><p class="small muted"><a href="#/">Início</a> / ${esc(title)}</p><h1 class="h2" style="margin-top:6px">${title}</h1>
  <div class="cat-layout"><aside class="filters" aria-label="Filtros">
    <div><label class="l" for="fq">Buscar</label><input id="fq" data-f="q" value="${esc(f.q)}" placeholder="Nome ou descrição" type="search"></div>
    <div><label class="l" for="fc">Categoria</label><select id="fc" data-f="cat"><option value="">Todas</option>${CATS.filter((c) => pub.some((p) => p.cat === c[0])).map((c) => `<option value="${c[0]}" ${f.cat === c[0] ? "selected" : ""}>${c[1]}</option>`).join("")}</select></div>
    <fieldset class="fgrp"><legend>Preço (R$)</legend><div style="display:flex;gap:8px"><input data-f="min" value="${esc(f.min)}" placeholder="min" inputmode="decimal" aria-label="Preço mínimo"><input data-f="max" value="${esc(f.max)}" placeholder="máx" inputmode="decimal" aria-label="Preço máximo"></div></fieldset>
    <fieldset class="fgrp"><legend>Tamanho</legend><div class="chips">${allSizes.map((s) => `<button class="chipb ${f.sizes.includes(s) ? "on" : ""}" data-a="ftoggle" data-k="sizes" data-v="${s}" aria-pressed="${f.sizes.includes(s)}">${s}</button>`).join("")}</div></fieldset>
    <fieldset class="fgrp"><legend>Cor</legend><div class="chips">${allColors.map((s) => `<button class="chipb ${f.colors.includes(s) ? "on" : ""}" data-a="ftoggle" data-k="colors" data-v="${s}" aria-pressed="${f.colors.includes(s)}">${s}</button>`).join("")}</div></fieldset>
    <label style="display:flex;gap:8px;align-items:center;font-weight:600;font-size:14px"><input type="checkbox" data-f="stock" ${f.stock ? "checked" : ""}> Somente disponíveis</label>
    ${active ? `<button class="btn o s" data-a="fclear">Limpar filtros</button>` : ""}</aside>
  <section aria-live="polite"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:18px"><span class="small muted">${list.length} ${list.length === 1 ? "produto" : "produtos"}</span>
    <label class="small" style="display:flex;gap:8px;align-items:center"><b>Ordenar</b><select data-f="sort" style="min-height:40px;width:auto"><option value="novidades" ${f.sort === "novidades" ? "selected" : ""}>Novidades</option><option value="preco-asc" ${f.sort === "preco-asc" ? "selected" : ""}>Menor preço</option><option value="preco-desc" ${f.sort === "preco-desc" ? "selected" : ""}>Maior preço</option><option value="nome" ${f.sort === "nome" ? "selected" : ""}>Nome (A–Z)</option></select></label></div>
  ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<div class="empty"><h3 class="h2" style="font-size:30px">Nada encontrado</h3><p class="muted">Nenhum produto corresponde aos filtros.</p><button class="btn k" data-a="fclear" style="margin-top:12px">Limpar filtros</button></div>`}</section></div></div>${footer()}`;
}
function product(slug) {
  const p = S.products.find((x) => x.slug === slug && x.published);
  if (!p) return `${header()}<div class="wrap" style="padding:80px 0;text-align:center"><h1 class="h2">Produto não encontrado</h1><a class="btn k" href="#/produtos" style="margin-top:20px">Ver produtos</a></div>${footer()}`;
  const sel = S.ui.sel && S.ui.sel.pid === p.id ? S.ui.sel : (S.ui.sel = { pid: p.id, size: sizes(p).length === 1 ? sizes(p)[0] : null, color: colors(p).length === 1 ? colors(p)[0] : null, qty: 1, err: null, added: false });
  const sz = sizes(p), cl = colors(p), v = findV(p, sel.size, sel.color);
  const state = (kind, val) => { const m = p.variants.filter((x) => x[kind] === val && (kind === "size" ? !sel.color || x.color === sel.color : !sel.size || x.size === sel.size)); return !m.length ? "dis" : m.some((x) => x.stock > 0) ? "" : "sold"; };
  const needs = (sz.length && !sel.size) || (cl.length && !sel.color);
  const any = stockOf(p) > 0, rel = S.products.filter((x) => x.published && x.id !== p.id && x.cat === p.cat).slice(0, 4);
  const pr = v?.price ?? price(p);
  return `${header()}<div class="wrap" style="padding-top:28px"><p class="small muted"><a href="#/">Início</a> / <a href="#/produtos" data-a="cat" data-c="${p.cat}">${CATS.find((c) => c[0] === p.cat)[1]}</a> / ${esc(p.name)}</p>
  <div class="pd"><div class="big"><img src="${IMG[p.img]}" alt="${esc(p.name)} (imagem demonstrativa)"></div>
  <div><span class="tag" style="background:#e5e7eb">Produto de demonstração</span>${p.badge ? ` <span class="tag">${esc(p.badge)}</span>` : ""}<h1 class="h2" style="font-size:clamp(34px,5vw,52px);margin-top:10px">${esc(p.name)}</h1>
  <p style="margin:14px 0 0"><span class="price" style="font-size:32px">${brl(pr)}</span>${saleOn(p) ? `<span class="old" style="font-size:18px">${brl(p.price)}</span>` : ""}</p>
  ${sz.length ? `<div style="margin-top:22px" role="radiogroup" aria-label="Tamanho"><label class="l">Tamanho${sel.size ? ": " + sel.size : ""}</label><div class="chips">${sz.map((s) => `<button class="chipb ${sel.size === s ? "on" : ""} ${state("size", s) === "dis" ? "dis" : state("size", s) === "sold" ? "dis" : ""}" role="radio" aria-checked="${sel.size === s}" ${state("size", s) === "dis" ? "disabled" : ""} data-a="pick" data-k="size" data-v="${s}">${s}</button>`).join("")}</div></div>` : ""}
  ${cl.length ? `<div style="margin-top:18px" role="radiogroup" aria-label="Cor"><label class="l">Cor${sel.color ? ": " + sel.color : ""}</label><div class="chips">${cl.map((s) => `<button class="chipb ${sel.color === s ? "on" : ""} ${state("color", s) !== "" ? "dis" : ""}" role="radio" aria-checked="${sel.color === s}" ${state("color", s) === "dis" ? "disabled" : ""} data-a="pick" data-k="color" data-v="${s}">${s}</button>`).join("")}</div></div>` : ""}
  <div style="display:flex;align-items:center;gap:16px;margin-top:22px;flex-wrap:wrap"><div class="qty" role="group" aria-label="Quantidade"><button data-a="qty" data-d="-1" ${sel.qty <= 1 ? "disabled" : ""} aria-label="Diminuir">−</button><output>${sel.qty}</output><button data-a="qty" data-d="1" ${v && sel.qty >= v.stock ? "disabled" : ""} aria-label="Aumentar">+</button></div>
  <span class="small" aria-live="polite">${!any ? "<b>Produto indisponível</b>" : needs ? "Selecione as opções" : !v ? "Combinação indisponível" : v.stock <= 0 ? '<b style="color:var(--brand-strong)">Opção esgotada</b>' : v.stock <= S.settings.lowStock ? `<b style="color:var(--brand-strong)">Restam ${v.stock} ${v.stock === 1 ? "unidade" : "unidades"}</b>` : '<b style="color:#166534">Em estoque</b>'}${v ? ` <span class="muted">SKU ${v.sku}</span>` : ""}</span></div>
  ${sel.err ? `<p class="alert e" role="alert" style="margin-top:16px">${sel.err}</p>` : ""}
  <div style="display:grid;gap:10px;margin-top:20px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))"><button class="btn p" data-a="add" ${any ? "" : "disabled"}>${sel.added ? "✔ Adicionado" : "🛍 Adicionar ao carrinho"}</button><button class="btn k" data-a="buynow" ${any ? "" : "disabled"}>✆ Continuar no WhatsApp</button></div>
  ${sel.added ? `<p class="small" role="status" style="margin-top:10px"><b>Item no carrinho.</b> <a href="#/carrinho" style="text-decoration:underline">Ver carrinho</a></p>` : ""}
  <section style="margin-top:28px;border-top:1px solid var(--line);padding-top:18px"><h2 style="font-size:22px">Descrição</h2><p class="muted">${esc(p.desc)}</p></section>
  <details style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px"><summary style="font:700 20px Outfit;cursor:pointer">Tabela de medidas</summary><p class="muted">Medidas de exemplo — a loja cadastra as medidas reais do fabricante.</p></details>
  <details style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px"><summary style="font:700 20px Outfit;cursor:pointer">Conservação</summary><p class="muted">Lavar à mão ou à máquina em ciclo delicado. Não usar alvejante.</p></details>
  <p class="small muted" style="margin-top:18px">A compra é finalizada pelo WhatsApp, onde confirmamos disponibilidade, frete e pagamento.</p></div></div>
  ${rel.length ? `<section class="s"><h2 class="h2" style="font-size:36px;margin-bottom:24px">Você também pode gostar</h2><div class="grid">${rel.map(card).join("")}</div></section>` : ""}</div>${footer()}`;
}
function favorites() { const l = S.products.filter((p) => S.favs.includes(p.id) && p.published); return `${header()}<div class="wrap" style="padding-top:34px"><h1 class="h2" style="margin-bottom:26px">Favoritos</h1>${l.length ? `<div class="grid">${l.map(card).join("")}</div>` : `<div class="empty"><h3 class="h2" style="font-size:28px">Nenhum favorito ainda</h3><p class="muted">Toque no coração de um produto para salvá-lo aqui.</p><a class="btn k" href="#/produtos" style="margin-top:12px">Ver produtos</a></div>`}</div>${footer()}`; }
function cart() {
  if (!S.cart.length) return `${header()}<div class="wrap" style="padding-top:34px"><h1 class="h2" style="margin-bottom:26px">Carrinho</h1><div class="empty"><h3 class="h2" style="font-size:28px">Seu carrinho está vazio</h3><p class="muted">Escolha seus produtos e finalize pelo WhatsApp.</p><a class="btn k" href="#/produtos" style="margin-top:12px">Ver produtos</a></div></div>${footer()}`;
  const q = quote(), c = S.ui.checkout || (S.ui.checkout = { name: "", phone: "", notes: "", consent: false, errs: {} });
  return `${header()}<div class="wrap" style="padding-top:34px"><div style="display:flex;justify-content:space-between;align-items:flex-end"><h1 class="h2">Carrinho</h1><button class="btn o s" data-a="clearcart">Esvaziar</button></div>
  <div class="cartg"><div>${q.lines.map((l) => `<div class="ci"><a class="t" href="#/produto/${l.slug || ""}">${l.img ? `<img src="${IMG[l.img]}" alt="">` : ""}</a><div style="flex:1;min-width:0"><a href="#/produto/${l.slug || ""}" style="font-weight:700;text-decoration:none">${esc(l.name)}</a><div class="small muted">${[l.size && "Tam " + l.size, l.color].filter(Boolean).join(" · ")}</div>${l.problem ? `<p class="small" role="alert" style="color:#b91c1c;font-weight:700;margin:4px 0">⚠ ${l.problem}</p>` : ""}
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px"><div class="qty"><button data-a="cqty" data-v="${l.vid}" data-d="-1" ${l.qty <= 1 ? "disabled" : ""} aria-label="Diminuir">−</button><output>${l.qty}</output><button data-a="cqty" data-v="${l.vid}" data-d="1" ${l.stock != null && l.qty >= l.stock ? "disabled" : ""} aria-label="Aumentar">+</button></div><b>${brl(l.unit * l.qty)}</b><button class="btn s o" data-a="crm" data-v="${l.vid}" aria-label="Remover ${esc(l.name)}">Remover</button></div></div></div>`).join("")}</div>
  <aside class="card sum" aria-label="Resumo"><h2 style="font-size:26px">Resumo</h2>
  <div style="display:flex;gap:8px;margin-top:14px"><input id="cup" placeholder="Cupom (ex.: ANA10)" value="${esc(S.ui.coupon || "")}" aria-label="Cupom" style="text-transform:uppercase"><button class="btn o s" data-a="coupon">Aplicar</button></div>
  ${q.couponMsg ? `<p class="small" role="status" style="font-weight:700;color:${q.couponMsg.e ? "#b91c1c" : "#166534"};margin:6px 0 0">${q.couponMsg.t}</p>` : ""}
  <div style="margin-top:14px"><div class="row"><span>Subtotal</span><b>${brl(q.sub)}</b></div>${q.discount ? `<div class="row" style="color:#166534"><span>Desconto (${q.coupon})</span><b>− ${brl(q.discount)}</b></div>` : ""}<div class="row"><span>Frete</span><b>${q.ship === 0 ? "Grátis" : "A confirmar no WhatsApp"}</b></div><div class="row tot"><span>Total estimado</span><span>${brl(q.total)}</span></div></div>
  <p class="small muted">Frete, disponibilidade final e pagamento são combinados no atendimento.</p>
  <form data-form="checkout" style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px;display:grid;gap:12px" novalidate><h3 style="font-size:20px">Seus dados</h3>
  <div><label class="l" for="cn">Nome *</label><input id="cn" name="name" value="${esc(c.name)}" autocomplete="name" aria-invalid="${!!c.errs.name}">${c.errs.name ? `<p class="small" style="color:#b91c1c;margin:4px 0 0">${c.errs.name}</p>` : ""}</div>
  <div><label class="l" for="cp">WhatsApp / telefone (opcional)</label><input id="cp" name="phone" value="${esc(c.phone)}" inputmode="tel" placeholder="(11) 99999-8888"></div>
  <label class="small" style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" name="consent" ${c.consent ? "checked" : ""}><span>Concordo em usar meu nome${""} para atender este pedido, conforme a <a href="#" data-a="policy" data-p="privacidade" style="text-decoration:underline">Política de Privacidade</a>.</span></label>${c.errs.consent ? `<p class="small" style="color:#b91c1c;margin:0">${c.errs.consent}</p>` : ""}
  ${q.blocked ? `<p class="small" style="color:#b91c1c">Corrija os itens indisponíveis para continuar.</p>` : ""}
  <button class="btn p lg" type="submit" ${q.blocked ? "disabled" : ""}>✆ Finalizar pelo WhatsApp</button></form></aside></div></div>${footer()}`;
}
function receipt(o) {
  const qtd = o.items.reduce((s, i) => s + i.qty, 0);
  return `<article class="receipt" aria-label="Recibo do pedido ${o.number}"><h2>RECIBO</h2><p style="text-align:center;margin:2px 0 18px">${esc(S.settings.name)}</p>
  <div>Pedido #${o.number}${o.name ? " para " + esc(o.name) : ""}<br>${new Date(o.created).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}<br>Situação: ${STATUS[o.status]}</div><div class="ds"></div>
  <div class="rw"><span>Qtd&nbsp;&nbsp;Item</span><span>Valor</span></div><div class="ds"></div>
  ${o.items.map((i) => `<div class="rw" style="margin-bottom:6px"><span>${String(i.qty).padStart(2, "0")}&nbsp;&nbsp;${esc(i.name)}${i.size || i.color ? `<br><small style="opacity:.7;padding-left:30px">${[i.size && "Tam " + i.size, i.color].filter(Boolean).join(" / ")}</small>` : ""}</span><span>${brl(i.unit * i.qty)}</span></div>`).join("")}<div class="ds"></div>
  <div class="rw"><span>Total de itens:</span><span>${qtd}</span></div><div class="rw"><span>Subtotal:</span><span>${brl(o.subtotal)}</span></div>${o.discount ? `<div class="rw"><span>Desconto (${o.coupon}):</span><span>- ${brl(o.discount)}</span></div>` : ""}<div class="rw"><span>Frete:</span><span>${o.shipping == null ? "A confirmar" : o.shipping === 0 ? "Grátis" : brl(o.shipping)}</span></div><div class="rw" style="font-weight:700"><span>Total:</span><span>${brl(o.total)}</span></div><div class="ds"></div>
  <div>Pagamento: ${o.paid ? "confirmado em " + new Date(o.paid).toLocaleDateString("pt-BR") : "a combinar no atendimento"}</div><div class="ds"></div>
  <p style="text-align:center;letter-spacing:.1em;margin:16px 0 0">Obrigado pela preferência!</p>${barcode(o.number)}<p style="text-align:center;font-size:13px;letter-spacing:.2em;margin:4px 0 0">${o.number}</p>
  <div style="display:flex;justify-content:center;margin-top:18px"><img src="${LOGO}" alt="${esc(S.settings.name)}" width="150" height="150" style="border-radius:26px"></div></article><div class="edge"></div>`;
}
function orderPage(id) {
  const o = S.orders.find((x) => x.id === id);
  if (!o) return `${header()}<div class="wrap" style="padding:80px 0;text-align:center"><h1 class="h2">Pedido não encontrado</h1></div>${footer()}`;
  const link = waLink(o);
  return `${header()}<div class="wrap" style="max-width:760px;padding-top:38px"><p style="color:#166534;font-weight:800">✔ Pedido registrado</p><h1 class="h2" style="margin-top:4px">Pedido ${o.number}</h1>
  <p class="muted">Situação: <b>${STATUS[o.status]}</b>. Seu pedido <b>ainda não está pago nem confirmado</b>: ele só segue após conversarmos pelo WhatsApp para confirmar disponibilidade, frete e pagamento.</p>
  <div class="dark" style="background:var(--ink);color:#fff;border-radius:32px;padding:24px;margin:22px 0">${link ? `<p style="margin:0 0 12px;font-weight:700">Continue a conversa com a loja:</p><a class="btn p lg" href="${link}" target="_blank" rel="noopener">✆ Abrir WhatsApp com meu pedido</a><p class="small" style="opacity:.8;margin:12px 0 0">A mensagem já vai preenchida. Se nada abrir, toque no botão acima — o pedido já está salvo.</p>`
    : `<p style="margin:0 0 10px;font-weight:700">O WhatsApp da loja ainda não foi configurado.</p><p class="small" style="opacity:.85">Na demonstração: abra <b>Painel admin → Configurações</b> e informe o número (com DDI e DDD). Esta é a mensagem que seria enviada:</p><pre style="white-space:pre-wrap;background:rgba(255,255,255,.08);border-radius:16px;padding:14px;font:13px Inter;margin:10px 0 0">${esc(waText(o))}</pre>`}</div>
  ${receipt(o)}<div style="text-align:center;margin-top:20px"><button class="btn o s" data-a="print" data-id="${o.id}">🖨 Imprimir / salvar em PDF</button></div><p class="small muted" style="text-align:center;margin-top:16px">Guarde esta página: o endereço contém seu acesso privado ao pedido.</p></div>${footer()}`;
}

/* ===== ADMIN ===== */
const NAV = [["admin", "Dashboard"], ["admin/pedidos", "Pedidos"], ["admin/produtos", "Produtos"], ["admin/estoque", "Estoque"], ["admin/cupons", "Cupons"], ["admin/banners", "Banners"], ["admin/clientes", "Clientes"], ["admin/configuracoes", "Configurações"], ["admin/equipe", "Equipe"]];
function adminShell(title, body, action = "") {
  const cur = route().slice(0, 2).join("/").replace(/^admin\/(pedidos|produtos)\/.+/, "admin/$1");
  const key = route().length === 1 ? "admin" : route().slice(0, 2).join("/");
  return `<div class="adm"><aside class="side dark"><div class="top" style="display:flex;align-items:center;gap:10px">${mark("", 34)}<div><b class="d" style="font-size:20px">${esc(S.settings.name)}</b><div class="small" style="opacity:.7">Administrador (demo)</div></div></div>
  <nav aria-label="Painel">${NAV.map(([h, n]) => `<a href="#/${h}" class="${key === h ? "on" : ""}">${n}</a>`).join("")}<a href="#/" style="opacity:.6">Ver loja ↗</a></nav></aside>
  <main class="main"><div class="pgh"><h1 class="d">${title}</h1>${action}</div>${body}</main></div>`;
}
function adminLogin() { return `<div class="login"><div class="c"><div style="display:flex;justify-content:center">${mark("", 70)}</div><h1 class="h2" style="font-size:36px;text-align:center;margin-top:10px">Painel administrativo</h1><p class="muted small" style="text-align:center">No sistema real, o acesso exige e-mail e senha (Supabase Auth) e a permissão é verificada no servidor.</p><form data-form="login" style="display:grid;gap:12px;margin-top:18px"><div><label class="l" for="le">E-mail</label><input id="le" value="demo@anafitness.com.br" autocomplete="username"></div><div><label class="l" for="lp">Senha</label><input id="lp" type="password" value="demonstracao" autocomplete="current-password"></div><button class="btn p lg">Entrar</button></form></div></div>`; }
function adminDash() {
  const days = S.ui.days || 30, from = Date.now() - days * 86400000;
  const os = S.orders.filter((o) => new Date(o.created) >= from), conf = os.filter((o) => CONF.includes(o.status));
  const sum = (a) => a.reduce((s, o) => s + o.total, 0);
  const byDay = {}; conf.forEach((o) => { const d = o.created.slice(5, 10); byDay[d] = (byDay[d] || 0) + o.total; });
  const keys = Object.keys(byDay).sort(), max = Math.max(1, ...Object.values(byDay));
  const top = {}; conf.forEach((o) => o.items.forEach((i) => (top[i.name] = (top[i.name] || 0) + i.qty)));
  const unavailable = S.products.filter((p) => p.published && stockOf(p) === 0).length, low = S.products.filter((p) => p.published).flatMap((p) => p.variants).filter((v) => v.stock > 0 && v.stock <= S.settings.lowStock).length;
  const K = (l, v, h) => `<div class="kpi"><small>${l}</small><b>${v}</b><i>${h}</i></div>`;
  return adminShell("Dashboard", `<div class="note" style="margin-bottom:14px">Dados de demonstração. Os indicadores se atualizam com os pedidos que você criar na loja.</div>
  <div class="chips" style="margin-bottom:14px">${[7, 30, 90].map((d) => `<button class="chipb ${days === d ? "on" : ""}" data-a="days" data-d="${d}">${d} dias</button>`).join("")}</div>
  <div class="kpis">${K("Pedidos criados", os.length, `últimos ${days} dias`)}${K("Aguardando contato", os.filter((o) => o.status === "pending_contact").length, "ainda sem atendimento")}${K("Confirmados", conf.length, "confirmado, em preparo, enviado ou entregue")}${K("Produtos cadastrados", S.products.length, "exceto arquivados")}${K("Valor dos pedidos criados", brl(sum(os.filter((o) => o.status !== "cancelled"))), "inclui pendentes; não é receita")}${K("Valor confirmado", brl(sum(conf)), "vendas confirmadas com a cliente")}${K("Valor recebido", brl(sum(os.filter((o) => o.paid && o.status !== "cancelled"))), "somente com pagamento registrado")}${K("Atenção no estoque", `${unavailable} / ${low}`, "indisponíveis / variantes em estoque baixo")}</div>
  <div class="two"><div class="panel"><h2>Vendas confirmadas por dia</h2>${keys.length ? `<div class="bars" role="img" aria-label="Gráfico de vendas confirmadas">${keys.map((k) => `<div title="${k}: ${brl(byDay[k])}"><i style="height:${Math.max(4, (byDay[k] / max) * 100)}%"></i>${k.slice(3)}/${k.slice(0, 2)}</div>`).join("")}</div>` : '<p class="muted">Nenhuma venda confirmada no período.</p>'}</div>
  <div class="panel"><h2>Mais vendidos (confirmados)</h2>${Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, q], i) => `<div class="row"><span>${i + 1}. ${esc(n)}</span><b>${q} un.</b></div>`).join("") || '<p class="muted">Sem histórico real ainda.</p>'}</div></div>`);
}
const pill = (s) => `<span class="pill st-${s}">${STATUS[s]}</span>`;
function adminOrders() {
  const f = S.ui.of || (S.ui.of = { status: "", q: "" });
  const l = [...S.orders].sort((a, b) => b.created.localeCompare(a.created)).filter((o) => (!f.status || o.status === f.status) && (!f.q || norm(o.number + o.name).includes(norm(f.q))));
  return adminShell("Pedidos", `<p class="muted small" style="margin-top:-12px">Pedidos registrados pelo site. Um pedido só é venda após a confirmação com o cliente.</p>
  <div class="fgrid c3" style="margin:14px 0"><div><label class="l" for="oq">Número ou cliente</label><input id="oq" data-of="q" value="${esc(f.q)}"></div><div><label class="l" for="os">Status</label><select id="os" data-of="status"><option value="">Todos</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${f.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></div></div>
  <div class="tw"><table><thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Total</th><th>Status</th><th>Pagamento</th></tr></thead><tbody>${l.length ? l.map((o) => `<tr class="hv" data-a="open" data-h="admin/pedidos/${o.id}" tabindex="0"><td><b style="text-decoration:underline">${o.number}</b></td><td>${dtf(o.created)}</td><td>${esc(o.name)}${o.phone ? `<br><small class="muted">${o.phone}</small>` : ""}</td><td><b>${brl(o.total)}</b></td><td>${pill(o.status)}</td><td>${o.paid ? '<b style="color:#166534">Recebido</b>' : '<span class="muted">Não registrado</span>'}</td></tr>`).join("") : '<tr><td colspan="6" style="text-align:center;padding:40px" class="muted">Nenhum pedido encontrado.</td></tr>'}</tbody></table></div>`);
}
function adminOrder(id) {
  const o = S.orders.find((x) => x.id === id); if (!o) return adminShell("Pedido", '<p class="muted">Pedido não encontrado.</p>');
  const nx = NEXT[o.status];
  return adminShell(`Pedido ${o.number}`, `<div class="two"><div>
  <div class="panel" style="margin-top:0"><h2>Situação</h2><p>${pill(o.status)} ${o.paid ? `<b style="color:#166534;margin-left:8px">Pagamento registrado em ${dtf(o.paid)}</b>` : '<span class="muted" style="margin-left:8px">Pagamento não registrado</span>'}</p>
  ${nx.length ? `<form data-form="status" data-id="${o.id}" style="display:grid;gap:12px;margin-top:12px" class="fgrid c2"><div><label class="l" for="ns">Novo status</label><select id="ns">${nx.map((n) => `<option value="${n}">${STATUS[n]}</option>`).join("")}</select></div><div><label class="l" for="nn">Observação (opcional)</label><input id="nn" maxlength="500"></div><div><button class="btn p s">Atualizar status</button></div></form><p class="small muted">Ao confirmar, o estoque dos itens é baixado (uma única vez). Cancelar um pedido confirmado devolve o estoque.</p>` : '<p class="muted">Este pedido está em um estado final.</p>'}
  <div style="border-top:1px solid var(--line);margin-top:14px;padding-top:14px"><p class="small muted">O site não processa pagamentos. Registre aqui apenas após receber o valor combinado no WhatsApp.</p><button class="btn ${o.paid ? "o" : "k"} s" data-a="pay" data-id="${o.id}">${o.paid ? "Remover registro de pagamento" : "Registrar pagamento recebido"}</button></div></div>
  <div class="panel"><h2>Itens</h2>${o.items.map((i) => `<div class="row"><span>${i.qty}× ${esc(i.name)} <small class="muted">${[i.size && "Tam " + i.size, i.color].filter(Boolean).join(", ")}</small></span><b>${brl(i.unit * i.qty)}</b></div>`).join("")}<div class="row" style="border-top:1px solid var(--line);margin-top:6px"><span>Subtotal</span><span>${brl(o.subtotal)}</span></div>${o.discount ? `<div class="row"><span>Desconto (${o.coupon})</span><span>− ${brl(o.discount)}</span></div>` : ""}<div class="row"><span>Frete</span><span>${o.shipping == null ? "A confirmar" : brl(o.shipping)}</span></div><div class="row tot"><span>Total</span><span>${brl(o.total)}</span></div></div>
  <div class="panel"><h2>Cliente</h2><p style="margin:0">${esc(o.name)}</p>${o.phone ? `<p style="margin:4px 0 0"><a href="https://wa.me/55${o.phone}" target="_blank" rel="noopener" style="text-decoration:underline">${o.phone}</a></p>` : '<p class="muted" style="margin:4px 0 0">Sem telefone informado</p>'}</div>
  <div class="panel"><h2>Histórico de status</h2>${o.history.map((h) => `<div style="border-left:4px solid var(--brand);padding-left:12px;margin:8px 0;font-size:14px"><span class="muted">${dtf(h.at)}</span> — ${h.from ? STATUS[h.from] + " → " : ""}<b>${STATUS[h.to]}</b>${h.note ? ` — ${esc(h.note)}` : ""}</div>`).join("")}</div></div>
  <div style="padding-top:18px">${receipt(o)}<div style="text-align:center;margin-top:16px"><button class="btn o s" data-a="print" data-id="${o.id}">🖨 Imprimir / salvar em PDF</button></div></div></div>`, `<a class="btn o s" href="#/admin/pedidos">← Voltar</a>`);
}
function adminProducts() {
  return adminShell("Produtos", `<div class="tw"><table><thead><tr><th></th><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th></tr></thead><tbody>${S.products.map((p) => `<tr class="hv" data-a="editp" data-id="${p.id}" tabindex="0"><td><img src="${IMG[p.img]}" alt="" width="48" height="48" style="border-radius:12px;object-fit:cover"></td><td><b style="text-decoration:underline">${esc(p.name)}</b>${p.featured ? ' <span class="tag">DESTAQUE</span>' : ""}</td><td>${CATS.find((c) => c[0] === p.cat)[1]}</td><td>${brl(p.price)}${saleOn(p) ? `<br><b style="color:var(--brand-strong)">Promo ${brl(p.sale)}</b>` : ""}</td><td ${stockOf(p) === 0 ? 'style="color:#b91c1c;font-weight:700"' : ""}>${stockOf(p) === 0 ? "Indisponível" : stockOf(p)}</td><td><span class="pill ${p.published ? "on-p" : "off-p"}">${p.published ? "Publicado" : "Rascunho"}</span></td></tr>`).join("")}</tbody></table></div>`, `<button class="btn p s" data-a="newp">+ Novo produto</button>`);
}
function productModal(p) {
  const n = !p; p = p || { id: "", name: "", cat: "roupas-masculinas", price: 0, sale: null, desc: "", published: false, featured: false, variants: [] };
  modal(`<h2 class="d" style="font-size:28px;margin-bottom:14px">${n ? "Novo produto" : "Editar: " + esc(p.name)}</h2><form data-form="product" data-id="${p.id}" style="display:grid;gap:12px" novalidate>
  <div><label class="l" for="pn">Nome</label><input id="pn" name="name" value="${esc(p.name)}" required></div>
  <div class="fgrid c2"><div><label class="l" for="pc">Categoria</label><select id="pc" name="cat">${CATS.map((c) => `<option value="${c[0]}" ${p.cat === c[0] ? "selected" : ""}>${c[1]}</option>`).join("")}</select></div><div><label class="l" for="ps">Status</label><select id="ps" name="published"><option value="0" ${!p.published ? "selected" : ""}>Rascunho (não visível)</option><option value="1" ${p.published ? "selected" : ""}>Publicado</option></select></div></div>
  <div class="fgrid c2"><div><label class="l" for="pp">Preço (R$)</label><input id="pp" name="price" inputmode="decimal" value="${p.price ? (p.price / 100).toFixed(2).replace(".", ",") : ""}" placeholder="99,90"></div><div><label class="l" for="pq">Preço promocional (R$)</label><input id="pq" name="sale" inputmode="decimal" value="${p.sale ? (p.sale / 100).toFixed(2).replace(".", ",") : ""}" placeholder="opcional"></div></div>
  <div><label class="l" for="pd">Descrição</label><textarea id="pd" name="desc" rows="3">${esc(p.desc)}</textarea></div>
  <label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" name="featured" ${p.featured ? "checked" : ""}> Produto em destaque na página inicial</label>
  ${n ? `<div class="fgrid c2"><div><label class="l" for="pz">Tamanhos (separados por vírgula)</label><input id="pz" name="sizes" placeholder="P, M, G"></div><div><label class="l" for="pk">Cores</label><input id="pk" name="colors" placeholder="Preto, Branco"></div><div><label class="l" for="pe">Estoque inicial por variante</label><input id="pe" name="stock" type="number" min="0" value="5"></div></div>` : `<p class="small muted">O estoque de cada variante é ajustado na tela <b>Estoque</b>, com motivo e histórico.</p>`}
  <p id="perr" class="alert e" role="alert" hidden></p><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px"><button type="button" class="btn o s" data-a="closemodal">Cancelar</button><button class="btn p s">Salvar</button></div></form>`);
}
function adminStock() {
  const f = S.ui.sf || (S.ui.sf = ""), rows = S.products.flatMap((p) => p.variants.map((v) => ({ p, v }))).filter(({ p, v }) => !f || (f === "low" ? v.stock > 0 && v.stock <= S.settings.lowStock : v.stock === 0)).sort((a, b) => a.v.stock - b.v.stock);
  return adminShell("Estoque", `<p class="muted small" style="margin-top:-12px">Limite de estoque baixo: ${S.settings.lowStock} un. O saldo só muda por movimentações registradas.</p>
  <div style="margin:12px 0"><label class="l" for="sf">Situação</label><select id="sf" data-sf style="max-width:260px"><option value="">Todos</option><option value="low" ${f === "low" ? "selected" : ""}>Estoque baixo</option><option value="zero" ${f === "zero" ? "selected" : ""}>Indisponíveis (zerado)</option></select></div>
  <div class="tw"><table><thead><tr><th>Produto</th><th>Variante</th><th>SKU</th><th>Saldo</th><th>Nova movimentação</th></tr></thead><tbody>${rows.slice(0, 40).map(({ p, v }) => `<tr><td><b>${esc(p.name)}</b></td><td>${[v.size && "Tam " + v.size, v.color].filter(Boolean).join(" · ") || "Única"}</td><td>${v.sku}</td><td><b style="color:${v.stock === 0 ? "#b91c1c" : v.stock <= S.settings.lowStock ? "var(--brand-strong)" : "inherit"}">${v.stock}</b>${v.stock === 0 ? '<br><small style="color:#b91c1c">Indisponível</small>' : v.stock <= S.settings.lowStock ? "<br><small>Baixo</small>" : ""}</td>
  <td><form data-form="stock" data-p="${p.id}" data-v="${v.id}" style="display:grid;grid-template-columns:110px 1fr 70px auto;gap:6px;min-width:420px"><select aria-label="Tipo"><option value="entry">Entrada</option><option value="exit">Saída</option><option value="adj">Correção (±)</option></select><input aria-label="Motivo" placeholder="Motivo (obrigatório)"><input aria-label="Quantidade" type="number" placeholder="Qtd"><button class="btn k s">Registrar</button></form></td></tr>`).join("")}</tbody></table></div>
  <div class="panel"><h2>Últimas movimentações</h2><div class="tw"><table><thead><tr><th>Data</th><th>Item</th><th>Tipo</th><th>Qtd</th><th>Saldo após</th><th>Motivo</th></tr></thead><tbody>${S.moves.slice(0, 15).map((m) => `<tr><td>${dtf(m.at)}</td><td>${esc(getP(m.pid)?.name || "")}</td><td>${m.type}</td><td><b style="color:${m.delta > 0 ? "#166534" : "#b91c1c"}">${m.delta > 0 ? "+" : ""}${m.delta}</b></td><td>${m.after}</td><td>${esc(m.reason)}</td></tr>`).join("") || '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">Nenhuma movimentação registrada ainda.</td></tr>'}</tbody></table></div></div>`);
}
function adminCoupons() {
  return adminShell("Cupons", `<div class="tw"><table><thead><tr><th>Código</th><th>Desconto</th><th>Mínimo</th><th>Usos</th><th>Validade</th><th>Estado</th><th></th></tr></thead><tbody>${S.coupons.map((c) => { const ex = c.expires && new Date(c.expires) <= new Date(); return `<tr><td><b>${c.code}</b></td><td>${c.type === "percent" ? c.value + "%" : brl(c.value)}</td><td>${c.min ? brl(c.min) : "—"}</td><td>${c.used}${c.limit ? " / " + c.limit : ""}</td><td>${c.expires ? `<span style="${ex ? "color:#b91c1c;font-weight:700" : ""}">${ex ? "Expirou " : "Até "}${dtf(c.expires)}</span>` : "Sem validade"}</td><td><span class="pill ${c.active && !ex ? "on-p" : "off-p"}">${ex ? "Expirado" : c.active ? "Ativo" : "Inativo"}</span></td><td><button class="btn o s" data-a="ctoggle" data-c="${c.code}">${c.active ? "Desativar" : "Ativar"}</button></td></tr>`; }).join("")}</tbody></table></div>
  <div class="panel"><h2>Novo cupom</h2><form data-form="coupon" class="fgrid c3" novalidate><div><label class="l" for="kc">Código</label><input id="kc" name="code" style="text-transform:uppercase" maxlength="32"></div><div><label class="l" for="kt">Tipo</label><select id="kt" name="type"><option value="percent">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option></select></div><div><label class="l" for="kv">Valor</label><input id="kv" name="value" placeholder="10 ou 25,00"></div><div><label class="l" for="km">Pedido mínimo (R$)</label><input id="km" name="min"></div><div><label class="l" for="kl">Limite de usos</label><input id="kl" name="limit" type="number" min="1"></div><div style="align-self:end"><button class="btn p s">Criar cupom</button></div></form><p id="cerr" class="alert e" role="alert" hidden style="margin-top:12px"></p><p class="note" style="margin-top:12px">Como a compra termina no WhatsApp, o desconto é validado no registro do pedido e confirmado no atendimento; não há aplicação automática em pagamento externo.</p></div>`);
}
function adminBanners() {
  return adminShell("Banners", `<p class="muted small" style="margin-top:-12px">Sem banner ativo no período, a seção de campanha some da página inicial.</p><div class="tw"><table><thead><tr><th>Título</th><th>Descrição</th><th>Estado</th><th></th></tr></thead><tbody>${S.banners.map((b) => `<tr><td><b>${esc(b.title)}</b></td><td>${esc(b.sub)}</td><td><span class="pill ${b.active ? "on-p" : "off-p"}">${b.active ? "No ar" : "Inativo"}</span></td><td style="white-space:nowrap"><button class="btn o s" data-a="btoggle" data-id="${b.id}">${b.active ? "Desativar" : "Ativar"}</button> <button class="btn o s" data-a="bedit" data-id="${b.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`, `<button class="btn p s" data-a="bnew">+ Novo banner</button>`);
}
function adminCustomers() {
  const m = {}; S.orders.forEach((o) => { const k = o.phone || o.name; (m[k] = m[k] || { name: o.name, phone: o.phone, os: [] }).os.push(o); });
  return adminShell("Clientes", `<p class="muted small" style="margin-top:-12px">Somente dados necessários ao atendimento. Nenhum dado de pagamento é armazenado.</p><div class="tw"><table><thead><tr><th>Nome</th><th>Telefone</th><th>Pedidos</th><th>Confirmados</th></tr></thead><tbody>${Object.values(m).map((c) => { const cf = c.os.filter((o) => CONF.includes(o.status)); return `<tr><td><b>${esc(c.name)}</b></td><td>${c.phone || "—"}</td><td>${c.os.length}</td><td>${cf.length} · ${brl(cf.reduce((s, o) => s + o.total, 0))}</td></tr>`; }).join("")}</tbody></table></div>`);
}
function adminSettings() {
  const s = S.settings;
  return adminShell("Configurações", `<form data-form="settings" class="panel" style="margin-top:0" novalidate><h2>Loja</h2><div class="fgrid c2"><div><label class="l" for="sn">Nome da loja</label><input id="sn" name="name" value="${esc(s.name)}"></div><div><label class="l" for="sw">WhatsApp (DDI + DDD + número)</label><input id="sw" name="whatsapp" value="${esc(s.whatsapp)}" placeholder="5511999998888" inputmode="numeric"><p class="small muted" style="margin:4px 0 0">Obrigatório para abrir a conversa com o pedido.</p></div></div>
  <h2 style="margin-top:22px">Barra promocional</h2><label style="display:flex;gap:8px;align-items:center;font-weight:600;margin-bottom:10px"><input type="checkbox" name="promoOn" ${s.promoOn ? "checked" : ""}> Exibir barra no topo da loja</label><div><label class="l" for="sp">Mensagem</label><input id="sp" name="promoText" value="${esc(s.promoText)}" maxlength="160"></div>
  <h2 style="margin-top:22px">Entrega e estoque</h2><div class="fgrid c2"><div><label class="l" for="sf2">Frete grátis a partir de (R$)</label><input id="sf2" name="freeShip" value="${s.freeShip ? (s.freeShip / 100).toFixed(2).replace(".", ",") : ""}" placeholder="vazio = sem frete grátis"><p class="small muted" style="margin:4px 0 0">Só é aplicado se preenchido.</p></div><div><label class="l" for="sl">Limite de estoque baixo</label><input id="sl" name="lowStock" type="number" min="0" value="${s.lowStock}"></div></div>
  <p id="serr" class="alert e" role="alert" hidden style="margin-top:12px"></p><button class="btn p" style="margin-top:18px">Salvar configurações</button><p class="small muted" style="margin-top:14px">No sistema real também é possível editar logotipo, cores, redes sociais, textos legais, SEO e conteúdo da página inicial.</p></form>`);
}
function adminTeam() {
  return adminShell("Equipe", `<p class="muted small" style="margin-top:-12px">Administrador: acesso total · Gerente: pedidos, estoque, cupons, clientes e produtos · Editor: produtos, categorias e banners.</p><div class="tw"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Função</th></tr></thead><tbody><tr><td><b>Ana (você)</b></td><td>demo@anafitness.com.br</td><td>Administrador</td></tr><tr><td>Carlos</td><td>gerente@exemplo.com</td><td>Gerente</td></tr><tr><td>Bia</td><td>conteudo@exemplo.com</td><td>Editor</td></tr></tbody></table></div><p class="note" style="margin-top:14px">Usuários de exemplo. No sistema real, as permissões são verificadas no servidor e no banco de dados; não existe cadastro público.</p>`);
}

/* ===== render ===== */
function render() {
  const r = route(), app = $("#app");
  let html;
  if (r[0] === "admin") {
    if (!S.ui.auth) html = adminLogin();
    else if (!r[1]) html = adminDash();
    else if (r[1] === "pedidos") html = r[2] ? adminOrder(r[2]) : adminOrders();
    else if (r[1] === "produtos") html = adminProducts();
    else if (r[1] === "estoque") html = adminStock();
    else if (r[1] === "cupons") html = adminCoupons();
    else if (r[1] === "banners") html = adminBanners();
    else if (r[1] === "clientes") html = adminCustomers();
    else if (r[1] === "configuracoes") html = adminSettings();
    else if (r[1] === "equipe") html = adminTeam();
    else html = adminDash();
  } else if (r[0] === "produtos") html = catalog();
  else if (r[0] === "produto") html = product(r[1]);
  else if (r[0] === "favoritos") html = favorites();
  else if (r[0] === "carrinho") html = cart();
  else if (r[0] === "pedido") html = orderPage(r[1]);
  else html = home();
  const y = scrollY, keep = document.activeElement?.id;
  app.innerHTML = html;
  $("#b-loja").classList.toggle("on", r[0] !== "admin"); $("#b-admin").classList.toggle("on", r[0] === "admin");
  document.title = (r[0] === "admin" ? "Painel — " : "") + S.settings.name + " — Demonstração";
  if (keep) { const e = document.getElementById(keep); if (e && e.value !== undefined && e.type !== "checkbox") { e.focus(); try { e.setSelectionRange(e.value.length, e.value.length); } catch {} } }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$(".rv", app).forEach((e) => io.observe(e));
  if (S.ui.keepScroll) { scrollTo(0, y); S.ui.keepScroll = false; }
}
const rerender = () => { S.ui.keepScroll = true; render(); };
window.addEventListener("hashchange", () => { closeModal(); $(".drawer")?.remove(); S.ui.sel = S.ui.sel; render(); scrollTo(0, 0); });

/* ===== eventos ===== */
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-a]"); if (!el) return;
  const a = el.dataset.a, d = el.dataset;
  if (a !== "cat" && a !== "sort" && a !== "policy" && el.tagName === "A" && a !== "menu") { /* links normais seguem */ }
  switch (a) {
    case "mode": go(d.m === "admin" ? "admin" : ""); break;
    case "reset": if (confirm("Reiniciar a demonstração e voltar aos dados iniciais?")) { localStorage.removeItem(KEY); S = seed(); save(); go(""); render(); toast("Demonstração reiniciada"); } break;
    case "menu": { const m = document.createElement("div"); m.className = "drawer dark"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.innerHTML = `<div class="bg" data-a="closemenu"></div><div class="pn"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span class="d" style="font-size:22px;font-weight:800;display:flex;gap:8px;align-items:center">${mark("", 30)}${esc(S.settings.name)}</span><button class="ic" data-a="closemenu" aria-label="Fechar menu" style="background:rgba(255,255,255,.1)">✕</button></div><a href="#/produtos">Todos os produtos</a>${CATS.slice(2, 7).map(([s, n]) => `<a href="#/produtos" data-a="cat" data-c="${s}">${n}</a>`).join("")}<a href="#/favoritos">Favoritos</a><a href="#/carrinho">Carrinho</a></div>`; document.body.appendChild(m); break; }
    case "closemenu": $(".drawer")?.remove(); break;
    case "search": { const q = prompt("Buscar produtos:"); if (q != null) { S.ui.f = { q, cat: "", sizes: [], colors: [], min: "", max: "", stock: false, sort: "novidades" }; save(); location.hash = "#/produtos"; if (route()[0] === "produtos") render(); } break; }
    case "cat": $(".drawer")?.remove(); S.ui.f = { q: "", cat: d.c, sizes: [], colors: [], min: "", max: "", stock: false, sort: "novidades" }; save(); if (route()[0] === "produtos") { render(); scrollTo(0, 0); } break;
    case "sort": S.ui.f = { q: "", cat: "", sizes: [], colors: [], min: "", max: "", stock: false, sort: "novidades" }; break;
    case "ftoggle": { const f = S.ui.f, l = f[d.k], i = l.indexOf(d.v); i < 0 ? l.push(d.v) : l.splice(i, 1); rerender(); break; }
    case "fclear": S.ui.f = null; rerender(); break;
    case "fav": { const i = S.favs.indexOf(d.id); i < 0 ? S.favs.push(d.id) : S.favs.splice(i, 1); save(); ev.preventDefault(); rerender(); toast(i < 0 ? "Adicionado aos favoritos" : "Removido dos favoritos"); break; }
    case "quick": { const p = getP(d.id), v = p.variants[0]; addCart(p.id, v.id, 1); toast("Adicionado ao carrinho"); rerender(); break; }
    case "pick": { const s = S.ui.sel, p = getP(s.pid), only = (d.k === "size" ? sizes(p) : colors(p)).length === 1; const cur = s[d.k]; s[d.k] = cur === d.v && !only ? null : d.v; s.err = null; s.added = false; rerender(); break; }
    case "qty": { const s = S.ui.sel, p = getP(s.pid), v = findV(p, s.size, s.color); s.qty = Math.max(1, Math.min(v ? v.stock : 99, s.qty + Number(d.d))); rerender(); break; }
    case "add": case "buynow": {
      const s = S.ui.sel, p = getP(s.pid), sz = sizes(p), cl = colors(p);
      if ((sz.length && !s.size) || (cl.length && !s.color)) { s.err = `Selecione ${sz.length && !s.size && cl.length && !s.color ? "o tamanho e a cor" : sz.length && !s.size ? "o tamanho" : "a cor"} para continuar.`; rerender(); break; }
      const v = findV(p, s.size, s.color);
      if (!v) { s.err = "Esta combinação não está disponível. Escolha outra opção."; rerender(); break; }
      if (v.stock <= 0) { s.err = "Esta opção está esgotada."; rerender(); break; }
      addCart(p.id, v.id, Math.min(s.qty, v.stock)); s.err = null; s.added = true;
      if (a === "buynow") go("carrinho"); else { rerender(); toast("Adicionado ao carrinho"); }
      break;
    }
    case "cqty": { const l = S.cart.find((x) => x.vid === d.v), nq = l.qty + Number(d.d); if (nq >= 1) l.qty = nq; save(); rerender(); break; }
    case "crm": S.cart = S.cart.filter((x) => x.vid !== d.v); save(); rerender(); break;
    case "clearcart": if (confirm("Esvaziar o carrinho?")) { S.cart = []; save(); rerender(); } break;
    case "coupon": S.ui.coupon = $("#cup").value.trim().toUpperCase(); save(); rerender(); break;
    case "policy": ev.preventDefault(); { const [t, b] = POL[d.p]; modal(`<h2 class="d" style="font-size:30px">${t}</h2><div class="muted" style="white-space:pre-line;margin-top:12px;line-height:1.6">${esc(b)}</div><div style="text-align:right;margin-top:16px"><button class="btn k s" data-a="closemodal">Fechar</button></div>`); } break;
    case "closemodal": closeModal(); break;
    case "print": { const o = S.orders.find((x) => x.id === d.id); $("#print").innerHTML = receipt(o); print(); break; }
    case "open": go(d.h); break;
    case "days": S.ui.days = Number(d.d); rerender(); break;
    case "pay": { const o = S.orders.find((x) => x.id === d.id); if (!o.paid && !CONF.includes(o.status)) { toast("Confirme o pedido antes de registrar o pagamento"); break; } o.paid = o.paid ? null : new Date().toISOString(); save(); rerender(); toast(o.paid ? "Pagamento registrado" : "Registro removido"); break; }
    case "newp": productModal(null); break;
    case "editp": productModal(getP(d.id)); break;
    case "ctoggle": { const c = S.coupons.find((x) => x.code === d.c); c.active = !c.active; save(); rerender(); break; }
    case "btoggle": { const b = S.banners.find((x) => x.id === d.id); b.active = !b.active; save(); rerender(); toast(b.active ? "Banner no ar" : "Banner desativado — a seção some da loja"); break; }
    case "bedit": case "bnew": { const b = d.id ? S.banners.find((x) => x.id === d.id) : { id: "", title: "", sub: "", btn: "Ver produtos", active: true }; modal(`<h2 class="d" style="font-size:28px;margin-bottom:14px">${d.id ? "Editar banner" : "Novo banner"}</h2><form data-form="banner" data-id="${b.id}" style="display:grid;gap:12px"><div><label class="l" for="bt">Título</label><input id="bt" name="title" value="${esc(b.title)}" required></div><div><label class="l" for="bs">Descrição</label><input id="bs" name="sub" value="${esc(b.sub)}"></div><div><label class="l" for="bb">Texto do botão</label><input id="bb" name="btn" value="${esc(b.btn)}"></div><p id="berr" class="alert e" hidden></p><div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" class="btn o s" data-a="closemodal">Cancelar</button><button class="btn p s">Salvar</button></div></form>`); break; }
  }
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("tr[data-a]")) e.target.click(); });
function addCart(pid, vid, qty) { const l = S.cart.find((x) => x.vid === vid); l ? (l.qty = Math.min(99, l.qty + qty)) : S.cart.push({ pid, vid, qty }); save(); }
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.f) { const f = S.ui.f || (S.ui.f = { q: "", cat: "", sizes: [], colors: [], min: "", max: "", stock: false, sort: "novidades" }); f[t.dataset.f] = t.type === "checkbox" ? t.checked : t.value; rerender(); }
  if (t.dataset.of != null) { S.ui.of[t.dataset.of] = t.value; rerender(); }
  if (t.hasAttribute("data-sf")) { S.ui.sf = t.value; rerender(); }
});
document.addEventListener("input", (e) => { const t = e.target; if (t.dataset.f === "q" || t.dataset.f === "min" || t.dataset.f === "max") { clearTimeout(window._ft); window._ft = setTimeout(() => { S.ui.f[t.dataset.f] = t.value; rerender(); }, 350); } if (t.dataset.of === "q") { clearTimeout(window._ft); window._ft = setTimeout(() => { S.ui.of.q = t.value; rerender(); }, 300); } });
const cents = (s) => { const t = String(s).trim().replace(/R\$\s?/i, ""); if (!t) return null; const n = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t; return /^\d+(\.\d{1,2})?$/.test(n) ? Math.round(parseFloat(n) * 100) : NaN; };
const showErr = (id, msg) => { const e = $("#" + id); if (e) { e.textContent = msg; e.hidden = false; } };
let ordering = false;
document.addEventListener("submit", (e) => {
  const f = e.target.closest("[data-form]"); if (!f) return; e.preventDefault();
  const k = f.dataset.form, g = (n) => f.elements[n];
  if (k === "login") { S.ui.auth = true; save(); render(); toast("Bem-vinda ao painel"); }
  if (k === "checkout") {
    if (ordering) return;
    const c = S.ui.checkout, q = quote(); c.name = g("name").value.trim(); c.phone = g("phone").value; c.consent = g("consent").checked; c.errs = {};
    if (c.name.length < 2) c.errs.name = "Informe seu nome"; if (!c.consent) c.errs.consent = "É necessário concordar com o uso dos dados para atender o pedido";
    if (c.phone && !/^\d{10,15}$/.test(c.phone.replace(/\D/g, ""))) c.errs.phone = "Telefone inválido";
    if (Object.keys(c.errs).length || q.blocked || !q.lines.length) { rerender(); return; }
    ordering = true;
    const lines = q.lines.filter((l) => !l.problem);
    const o = { id: uid() + uid(), number: "LF-" + uid().toUpperCase().slice(0, 8), name: c.name, phone: c.phone.replace(/\D/g, ""), items: lines.map((l) => ({ pid: l.pid, vid: l.vid, name: l.name, size: l.size, color: l.color, qty: l.qty, unit: l.unit })), subtotal: q.sub, discount: q.discount, coupon: q.coupon, shipping: q.ship, total: q.total, status: "pending_contact", committed: false, paid: null, created: new Date().toISOString(), history: [{ from: null, to: "pending_contact", at: new Date().toISOString(), note: "Pedido registrado pelo site" }] };
    if (q.coupon) S.coupons.find((x) => x.code === q.coupon).used++;
    S.orders.push(o); S.cart = []; S.ui.checkout = null; S.ui.coupon = ""; save(); ordering = false;
    go("pedido/" + o.id); toast("Pedido registrado!");
  }
  if (k === "status") { const o = S.orders.find((x) => x.id === f.dataset.id), err = setStatus(o, $("#ns").value, $("#nn").value); if (err) { toast(err); return; } save(); rerender(); toast("Status atualizado"); }
  if (k === "stock") {
    const [t, r, q] = [f.elements[0].value, f.elements[1].value.trim(), parseInt(f.elements[2].value, 10)], p = getP(f.dataset.p), v = p.variants.find((x) => x.id === f.dataset.v);
    if (r.length < 3) return toast("Informe o motivo (mínimo 3 caracteres)");
    if (!q) return toast("Informe uma quantidade diferente de zero");
    const delta = t === "entry" ? Math.abs(q) : t === "exit" ? -Math.abs(q) : q;
    if (v.stock + delta < 0) return toast("Estoque insuficiente: o saldo não pode ficar negativo");
    v.stock += delta; S.moves.unshift({ at: new Date().toISOString(), pid: p.id, vid: v.id, type: t === "entry" ? "Entrada" : t === "exit" ? "Saída" : "Correção", delta, after: v.stock, reason: r }); save(); rerender(); toast(`Saldo atual: ${v.stock}`);
  }
  if (k === "coupon") {
    const code = g("code").value.trim().toUpperCase(), type = g("type").value, raw = g("value").value, min = cents(g("min").value || "0"), lim = g("limit").value ? parseInt(g("limit").value, 10) : null;
    const val = type === "percent" ? parseInt(raw, 10) : cents(raw);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return showErr("cerr", "Código: use 3–32 letras, números, _ ou -");
    if (S.coupons.some((c) => c.code === code)) return showErr("cerr", "Já existe um cupom com este código.");
    if (!val || isNaN(val) || val <= 0 || (type === "percent" && val > 100)) return showErr("cerr", type === "percent" ? "Percentual inteiro entre 1 e 100" : "Valor inválido");
    if (isNaN(min)) return showErr("cerr", "Pedido mínimo inválido");
    S.coupons.unshift({ code, type, value: val, min: min || 0, limit: lim, used: 0, expires: null, active: true }); save(); rerender(); toast("Cupom criado");
  }
  if (k === "banner") { const t = g("title").value.trim(); if (t.length < 2) { showErr("berr", "Informe o título"); return; } let b = S.banners.find((x) => x.id === f.dataset.id); if (!b) { b = { id: uid(), active: true }; S.banners.push(b); } Object.assign(b, { title: t, sub: g("sub").value.trim(), btn: g("btn").value.trim() }); save(); closeModal(); rerender(); toast("Banner salvo"); }
  if (k === "settings") {
    const w = g("whatsapp").value.replace(/\D/g, ""), fs = cents(g("freeShip").value);
    if (g("whatsapp").value && !/^[1-9]\d{9,14}$/.test(w)) return showErr("serr", "WhatsApp inválido: use o formato internacional (ex.: 5511999998888).");
    if (isNaN(fs)) return showErr("serr", "Valor de frete grátis inválido.");
    if (g("promoOn").checked && !g("promoText").value.trim()) return showErr("serr", "Informe o texto da barra promocional.");
    if (g("name").value.trim().length < 2) return showErr("serr", "Informe o nome da loja.");
    Object.assign(S.settings, { name: g("name").value.trim(), whatsapp: w, promoOn: g("promoOn").checked, promoText: g("promoText").value.trim(), freeShip: fs || null, lowStock: parseInt(g("lowStock").value, 10) || 0 }); save(); rerender(); toast("Configurações salvas — veja na loja");
  }
  if (k === "product") {
    const name = g("name").value.trim(), price = cents(g("price").value), sale = g("sale").value.trim() ? cents(g("sale").value) : null;
    if (name.length < 2) return showErr("perr", "Informe o nome do produto.");
    if (!price || isNaN(price)) return showErr("perr", "Informe um preço válido.");
    if (sale != null && (isNaN(sale) || sale >= price)) return showErr("perr", "O preço promocional deve ser menor que o preço.");
    let p = S.products.find((x) => x.id === f.dataset.id);
    if (!p) {
      const id = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || uid();
      if (S.products.some((x) => x.id === id)) return showErr("perr", "Já existe um produto com este nome (slug duplicado).");
      const szs = g("sizes").value.split(",").map((s) => s.trim()).filter(Boolean), cls = g("colors").value.split(",").map((s) => s.trim()).filter(Boolean);
      p = { id, slug: id, img: "camiseta", badge: null, variants: mkVariants(id, szs, cls, [Math.max(0, parseInt(g("stock").value, 10) || 0)]) }; S.products.unshift(p);
      p.variants.forEach((v) => v.stock > 0 && S.moves.unshift({ at: new Date().toISOString(), pid: id, vid: v.id, type: "Entrada", delta: v.stock, after: v.stock, reason: "Estoque inicial" }));
    }
    Object.assign(p, { name, cat: g("cat").value, price, sale, desc: g("desc").value.trim(), published: g("published").value === "1", featured: g("featured").checked }); save(); closeModal(); rerender(); toast("Produto salvo");
  }
});
render();
