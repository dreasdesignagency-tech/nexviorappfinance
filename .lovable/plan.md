# Lançamento Founder Access — Plano

Criar um fluxo de acesso antecipado gratuito para divulgar no Instagram, com landing dedicada, cadastro com ativação automática como Founder, selo no perfil e painel admin com métricas. Stripe, checkout e usuários existentes não são tocados.

## 1. Banco de dados (migration)

**Nova tabela `launch_signups`** (auditoria/tracking de leads do Instagram):
- `user_id` (uuid, FK lógico para auth.users)
- `email`, `full_name`, `phone`
- `signup_source` (text, default `instagram_launch`)
- `created_from_launch` (bool, default true)
- `founder_user` (bool, default true)
- `created_at`
- RLS: usuário vê o próprio registro; admins veem tudo.

**Estender `user_subscriptions`** (sem mexer em assinantes pagos):
- adicionar coluna `is_founder` (bool, default false)
- adicionar coluna `signup_source` (text, nullable)

**`has_active_subscription` / `useSubscription`**: já aceita `plan_type = 'free_access'`. Founders entram como `subscription_status = 'active'` + `plan_type = 'founder'` (novo valor aceito) e `is_founder = true`. Atualizar `useSubscription.hasAccess` para incluir `founder`.

**RPC `register_founder_user(p_source text)`** (SECURITY DEFINER):
- Lê `auth.uid()`, busca email/metadata.
- Insere/upserta `profiles` (nome, telefone vindos do metadata).
- Upserta `user_subscriptions` com `subscription_status='active'`, `plan_type='founder'`, `is_founder=true`, `signup_source=p_source`.
- Insere em `launch_signups` (idempotente por `user_id`).
- Retorna `jsonb` com status.

**RPC `admin_launch_stats()`** (admin only): retorna totais — total de founders, signups das últimas 24h/7d, vagas restantes (se limite configurado), lista paginada.

**RPC `admin_set_launch_open(p_open bool, p_max_slots int)`**: grava em uma tabela simples `launch_settings (id=1, is_open bool, max_slots int, updated_at)`.

## 2. Frontend

**Nova rota `/founder`** (pública) — landing premium dark/glassmorphism:
- Hero: "Entre gratuitamente no Nexvior" + subtexto + CTA "Criar conta grátis".
- Banner "Founder Access" com glow, animação suave (motion).
- Contador opcional de vagas (lê `launch_settings`).
- Mostra "vagas esgotadas" quando `is_open=false` ou `count >= max_slots`.
- Reaproveita componentes de `landing/` (gradientes, BlurText, GradientText) para manter identidade.

**Nova rota `/founder/cadastro`** (ou modo no Auth via query `?source=founder`):
- Form: nome completo, email, WhatsApp, senha (mesmo schema zod do Auth).
- Após `supabase.auth.signUp` bem-sucedido, dispara `supabase.rpc('register_founder_user', { p_source: 'instagram_launch' })`.
- Se confirmação de email estiver ativa, mostra "verifique seu email"; senão redireciona para `/completar-perfil` → dashboard.
- `AuthCallback` também chama `register_founder_user` quando `source=founder` no state.

**Selo Founder no perfil** (`Perfil.tsx`): ler `is_founder` de `user_subscriptions` e exibir badge dourado com tooltip "Founder — Acesso Antecipado".

**Onboarding premium**: na primeira entrada após cadastro founder, mostrar modal de boas-vindas (reaproveita `OnboardingTour`) com cópia "Bem-vindo, Founder".

## 3. Painel admin

Nova aba em `/admin/membros` (ou `/admin/lancamento`):
- Cards com KPIs: total founders, signups hoje/7d, vagas restantes.
- Toggle "Lançamento aberto" (chama `admin_set_launch_open`).
- Input de "vagas máximas".
- Tabela: lista de founders com email, nome, telefone, data, source.
- Botão "revogar founder" (chama RPC que zera `is_founder` e marca `subscription_status='inactive'`).

## 4. Tracking & segurança

- Schema zod no form de cadastro (já existe no Auth, será reutilizado).
- `email` único garantido pelo `auth.users` (Supabase já bloqueia duplicado).
- RPC idempotente: rodar duas vezes não cria registros extras.
- Categorias padrão: nada novo — o app já usa categorias livres por transação. Não há tabela de categorias para popular.
- Founders **não** passam pelo Stripe; `ProtectedRoute` já libera por `hasAccess`.

## 5. Não alterado

- `create-checkout`, `stripe-webhook`, preços Stripe, secrets.
- Layout do dashboard.
- Usuários existentes (migration só adiciona colunas com default).
- Fluxo de assinantes pagos.

## Arquivos

```text
supabase/migrations/<novo>.sql      # tabelas, colunas, RPCs, RLS
src/pages/FounderLanding.tsx        # nova landing /founder
src/pages/FounderSignup.tsx         # cadastro dedicado /founder/cadastro
src/pages/AdminLancamento.tsx      # painel admin (ou aba em AdminMembros)
src/components/FounderBadge.tsx     # selo dourado
src/hooks/useSubscription.ts        # incluir 'founder' em hasAccess
src/pages/Perfil.tsx                # exibir badge
src/pages/AuthCallback.tsx          # chamar register_founder_user quando source=founder
src/App.tsx                         # registrar rotas /founder e /founder/cadastro
```

## Link para Instagram

Após implementar, o link a divulgar será:
`https://nexviorappfinance.lovable.app/founder`