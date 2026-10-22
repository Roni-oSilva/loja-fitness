# Loja Fitness

Loja virtual de artigos fitness com landing page, catálogo, carrinho, **pedido finalizado pelo WhatsApp com recibo**, e painel administrativo protegido.

**Stack:** Next.js 16 (App Router) · TypeScript estrito · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage) · Zod · Vercel.

O nome da loja é provisório e configurável (Admin → Configurações). Nada de endereço, CNPJ, avaliações ou depoimentos é inventado.

## Como funciona a compra

1. O cliente escolhe tamanho/cor/quantidade e monta o carrinho (guardado no navegador).
2. No carrinho, o **servidor recalcula tudo** (preço, promoção, estoque, cupom, frete) a partir do banco — o navegador nunca é fonte de preço.
3. Ao finalizar, o pedido é **salvo no banco** (`pending_contact`, função SQL atômica e idempotente) *antes* de abrir o WhatsApp.
4. O cliente vai para `/pedido/[id]?t=<token>` — acesso por token aleatório (guardado só como hash SHA-256) — com o **recibo** e o botão "Abrir WhatsApp". Se o navegador bloquear a abertura, o botão continua lá; o pedido nunca se perde.
5. A equipe atende no WhatsApp e, no painel, muda o status. **Confirmar** baixa o estoque (uma única vez); **cancelar** um pedido confirmado devolve. Pagamento recebido é um registro manual separado (o site não processa pagamentos).

O recibo (PT-BR, com código de barras Code 39 do número do pedido e a logo da loja) não é nota fiscal e só mostra "pagamento confirmado" quando a loja o registra.

## Estrutura

```
src/app/(shop)/      páginas públicas          src/app/admin/   painel (login + (panel))
src/features/        cart · products · orders · admin (formulários, upload, helpers)
src/lib/             pricing, money, whatsapp, barcode, order-status, rate-limit, validations/, services/, supabase/
supabase/migrations/ schema, funções, RLS, storage    supabase/seed.sql  dados de demonstração
tests/               unit · db (migrations reais em PGlite) · e2e (Playwright)
scripts/create-first-admin.mjs
```

## Instalação (desenvolvimento)

```bash
npm install
cp .env.example .env.local        # preencha com as chaves do seu projeto Supabase
npm run dev
```

| Variável | Onde | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` / Vercel | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` / Vercel | pública (protegida por RLS) |
| `NEXT_PUBLIC_SITE_URL` | `.env.local` / Vercel | canonical, sitemap, Open Graph |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` / Vercel (**Sensitive**) | **só servidor**; nunca com prefixo `NEXT_PUBLIC_` |

Sem as variáveis, a loja abre vazia (estados vazios honestos) e o login do painel avisa o que falta.

## Banco de dados (Supabase)

1. Crie um projeto no Supabase.
2. Aplique as migrations **em ordem** (`supabase db push` com a CLI, ou cole cada arquivo de `supabase/migrations/` no SQL Editor).
3. **Authentication → Providers → Email:** *desative “Allow new users to sign up”* (contas só são criadas pelo painel/script). Defina política de senha forte.
4. Storage: o bucket público `media` e suas políticas são criados pela migration `…0004_storage.sql`.
5. (Opcional, só homologação) `supabase/seed.sql` insere categorias, 8 produtos **marcados como demonstração**, variantes, estoque, banner e textos iniciais.

### Primeiro administrador (sem senha padrão)

```bash
node --env-file=.env.local scripts/create-first-admin.mjs voce@exemplo.com "Seu Nome"
```
A senha é digitada no terminal (sem eco). O script recusa rodar se já houver um admin. Depois, crie gerentes/editores em **Admin → Equipe**.

Funções: **admin** (tudo) · **manager** (pedidos, estoque, cupons, clientes, produtos) · **editor** (produtos, categorias, banners). A autorização é verificada no servidor em toda página/ação **e** no banco (RLS + funções `SECURITY DEFINER` que checam o papel).

## Antes de lançar — configure em Admin → Configurações

- **WhatsApp** (DDI+DDD, ex.: `5511999998888`) — sem ele não é possível finalizar pedidos.
- Nome da loja, **logotipo** (usado no topo, rodapé e recibo), favicon, cores, redes sociais, e-mail, condições de entrega, frete grátis (só é anunciado/aplicado se preenchido).
- **Fotos do hero** e dos produtos (as imagens `/demo/*.svg` são ilustrativas).
- Textos de privacidade, termos e trocas (hoje há modelos provisórios sinalizados na página — **revise com um profissional**).
- Arquive os produtos de demonstração.

## Deploy (Vercel)

1. Importe o repositório; framework Next.js (detecção automática).
2. Configure as 4 variáveis acima (a `SERVICE_ROLE` como *Sensitive*).
3. Aponte o domínio e confirme HTTPS; ajuste `NEXT_PUBLIC_SITE_URL`.
4. Rode a jornada completa em homologação (ver Testes) e verifique os logs.
5. Ative backups do Supabase (PITR/diários) e monitoramento (Vercel Analytics/Logs; alertas de erro).

## Testes

```bash
npm test            # 51 testes: regras de negócio + banco (migrations reais em PGlite)
npm run build && npm run test:e2e   # Playwright: público, mobile, admin protegido, headers
E2E_FULL=1 E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e   # jornada completa (Supabase de homologação)
npm run typecheck && npm run lint
```
Cobertura do banco: RLS (anon não lê pedidos/cupons/clientes), autoprodução de admin bloqueada, estoque imutável e nunca negativo, pedido idempotente, preço adulterado, variante inexistente, cupom expirado/esgotado, transições de status, baixa/devolução única de estoque, salvamento atômico de produto.

## Segurança (resumo)

Server Actions com validação Zod · RLS em todas as tabelas · `service_role` só no servidor · upload validado pelo **conteúdo** (magic bytes; SVG recusado), nome gerado, 5 MB · token de pedido aleatório, comparado em tempo constante, página `noindex` e `no-referrer` · rate limit (login, pedidos, consulta de pedido, upload) · honeypot anti-bot · redirecionamentos só internos · CSP e demais cabeçalhos · `/admin` `noindex` + `no-store` · mensagens de erro genéricas e logs sem dados pessoais.

## Limitações conhecidas (leia antes de lançar)

- **Não foi executado contra uma instância real do Supabase** neste ambiente. O SQL (schema, RLS, funções, seed) é testado em PGlite com stubs de `auth`/`storage`; as **políticas do Storage**, o Supabase Auth e as Server Actions autenticadas precisam ser validadas em homologação (`E2E_FULL=1`).
- O **rate limit é em memória** (por instância serverless). Para tráfego real, troque por Redis/Upstash mantendo a assinatura de `src/lib/rate-limit.ts`.
- Filtros do catálogo rodam em TypeScript sobre até 1.000 produtos publicados (acentos/preço vigente corretos); acima disso, migre para uma função SQL paginada.
- Não há avaliações públicas: a tabela `reviews` existe, mas nada é exibido sem aprovação manual (inserção por SQL/painel futuro).
- Sem analytics/cookies de terceiros; se adicionar, implemente consentimento (LGPD) antes.
- Frete é sempre "a confirmar" (ou grátis se configurado); não há cálculo por CEP.
- Textos legais são modelos provisórios.
