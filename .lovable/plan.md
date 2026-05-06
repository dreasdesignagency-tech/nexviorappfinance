## Objetivo
Implementar pagamento recorrente para Assinaturas pessoais (Spotify, Netflix, etc.) no Nexvior. Cada assinatura ativa gera cobranças mensais/anuais; o usuário clica em "Pagar" e o sistema registra despesa, marca como paga e agenda a próxima.

## 1. Banco de dados (migration)

Nova tabela `subscription_charges`:
- `id` uuid PK
- `user_id` uuid (RLS própria)
- `subscription_id` uuid (referencia subscriptions.id)
- `mes_referencia` text (formato `YYYY-MM` para mensal, `YYYY` para anual)
- `valor` numeric
- `vencimento` date
- `status` text default `pendente` (pendente | pago | atrasado)
- `data_pagamento` timestamptz null
- `transaction_id` uuid null (link com a despesa criada)
- `created_at`, `updated_at`
- `UNIQUE(subscription_id, mes_referencia)` ← evita duplicação

RLS: 4 políticas padrão (user_id = auth.uid()).

## 2. Geração e atualização de cobranças (client-side)

Novo store `src/store/subscriptionCharges.tsx`:
- `charges: SubscriptionCharge[]`
- `payCharge(chargeId)`: marca pago, cria transação, gera próxima
- `refetch()`
- Ao montar e quando `assinaturas` ou `charges` mudam:
  - **Geração**: para cada assinatura `ativa`, garantir que existe cobrança do período atual (mês atual se mensal; ano atual se anual). Insert com onConflict para não duplicar.
  - **Status atrasado**: cobranças `pendente` com `vencimento < hoje` viram `atrasado`.
  - **Notificações** (usando store/notifications existente, com dedup_key = `charge:{id}:{evento}`):
    - 3 dias antes do vencimento
    - no dia do vencimento
    - quando atrasada

## 3. Botão "Pagar"

Em `src/pages/Recorrentes.tsx`, na lista de Assinaturas:
- Mostrar status da cobrança do mês atual (Pendente / Pago / Atrasado) com badge.
- Botão "Pagar" visível quando status é `pendente` ou `atrasado`.
- Ao clicar:
  1. UPDATE charge: status=`pago`, data_pagamento=now()
  2. INSERT transaction: tipo=`despesa`, descricao=nome da assinatura, valor, categoria, data=hoje, forma_pagamento, cartao_id, observacoes=`Pagamento de assinatura`
  3. UPDATE charge.transaction_id
  4. INSERT próxima cobrança (mês+1 ou ano+1) se ainda não existe
  5. Toast de sucesso + notificação `Assinatura paga`

## 4. Integrações automáticas

Como tudo já reage ao store de transações (dashboard, despesas, saldo, calendário, saúde, nex.ia), basta usar `useTransactions().addTransaction(...)` — atualização propaga sozinha.

## 5. UI
Manter design atual (glass-card, badges existentes). Adicionar pequena seção "Próximo vencimento" + status na linha de cada assinatura.

## Arquivos
- `supabase/migrations/...sql` — nova tabela + RLS + índice
- `src/store/subscriptionCharges.tsx` — novo
- `src/App.tsx` — provider
- `src/pages/Recorrentes.tsx` — botão Pagar + status
- `src/integrations/supabase/types.ts` — adicionar tipos (manual, será regenerado)

Sem alterações no Stripe, sem alterações em rotas existentes.
