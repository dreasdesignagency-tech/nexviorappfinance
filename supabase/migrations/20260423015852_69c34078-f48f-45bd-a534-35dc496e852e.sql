create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text not null,
  banco text not null,
  tipo text not null,
  limite numeric,
  dia_vencimento integer,
  dia_fechamento integer,
  bandeira text,
  cor text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text not null,
  valor_total numeric not null,
  valor_parcela numeric not null,
  total_parcelas integer not null,
  parcela_atual integer not null default 1,
  data_inicio date not null,
  proxima_cobranca date not null,
  status text not null,
  categoria text,
  cartao_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text not null,
  valor numeric not null,
  frequencia text not null,
  data_cobranca date not null,
  status text not null default 'ativa',
  categoria text,
  forma_pagamento text,
  cartao_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  categoria text not null,
  valor_limite numeric not null,
  periodo text not null,
  data_inicial date not null,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text not null,
  tipo text not null,
  valor_investido numeric not null,
  valor_atual numeric,
  rentabilidade numeric,
  data_investimento date not null,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titulo text not null,
  descricao text,
  data date not null,
  hora text,
  tipo text not null,
  prioridade text not null,
  recorrente boolean not null default false,
  frequencia text,
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titulo text not null,
  descricao text,
  prazo date,
  prioridade text not null,
  categoria text,
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cards enable row level security;
alter table public.installments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.limits enable row level security;
alter table public.investments enable row level security;
alter table public.reminders enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "Users can view own cards" on public.cards;
drop policy if exists "Users can insert own cards" on public.cards;
drop policy if exists "Users can update own cards" on public.cards;
drop policy if exists "Users can delete own cards" on public.cards;
create policy "Users can view own cards" on public.cards for select using (auth.uid() = user_id);
create policy "Users can insert own cards" on public.cards for insert with check (auth.uid() = user_id);
create policy "Users can update own cards" on public.cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own cards" on public.cards for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own installments" on public.installments;
drop policy if exists "Users can insert own installments" on public.installments;
drop policy if exists "Users can update own installments" on public.installments;
drop policy if exists "Users can delete own installments" on public.installments;
create policy "Users can view own installments" on public.installments for select using (auth.uid() = user_id);
create policy "Users can insert own installments" on public.installments for insert with check (auth.uid() = user_id);
create policy "Users can update own installments" on public.installments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own installments" on public.installments for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
drop policy if exists "Users can insert own subscriptions" on public.subscriptions;
drop policy if exists "Users can update own subscriptions" on public.subscriptions;
drop policy if exists "Users can delete own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert own subscriptions" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update own subscriptions" on public.subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own subscriptions" on public.subscriptions for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own limits" on public.limits;
drop policy if exists "Users can insert own limits" on public.limits;
drop policy if exists "Users can update own limits" on public.limits;
drop policy if exists "Users can delete own limits" on public.limits;
create policy "Users can view own limits" on public.limits for select using (auth.uid() = user_id);
create policy "Users can insert own limits" on public.limits for insert with check (auth.uid() = user_id);
create policy "Users can update own limits" on public.limits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own limits" on public.limits for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own investments" on public.investments;
drop policy if exists "Users can insert own investments" on public.investments;
drop policy if exists "Users can update own investments" on public.investments;
drop policy if exists "Users can delete own investments" on public.investments;
create policy "Users can view own investments" on public.investments for select using (auth.uid() = user_id);
create policy "Users can insert own investments" on public.investments for insert with check (auth.uid() = user_id);
create policy "Users can update own investments" on public.investments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own investments" on public.investments for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own reminders" on public.reminders;
drop policy if exists "Users can insert own reminders" on public.reminders;
drop policy if exists "Users can update own reminders" on public.reminders;
drop policy if exists "Users can delete own reminders" on public.reminders;
create policy "Users can view own reminders" on public.reminders for select using (auth.uid() = user_id);
create policy "Users can insert own reminders" on public.reminders for insert with check (auth.uid() = user_id);
create policy "Users can update own reminders" on public.reminders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own reminders" on public.reminders for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own tasks" on public.tasks;
drop policy if exists "Users can insert own tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

create index if not exists idx_cards_user_id on public.cards(user_id);
create index if not exists idx_installments_user_id on public.installments(user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_limits_user_id on public.limits(user_id);
create index if not exists idx_investments_user_id on public.investments(user_id);
create index if not exists idx_reminders_user_id on public.reminders(user_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);

drop trigger if exists update_cards_updated_at on public.cards;
create trigger update_cards_updated_at
before update on public.cards
for each row execute function public.update_updated_at_column();

drop trigger if exists update_installments_updated_at on public.installments;
create trigger update_installments_updated_at
before update on public.installments
for each row execute function public.update_updated_at_column();

drop trigger if exists update_subscriptions_updated_at on public.subscriptions;
create trigger update_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.update_updated_at_column();

drop trigger if exists update_limits_updated_at on public.limits;
create trigger update_limits_updated_at
before update on public.limits
for each row execute function public.update_updated_at_column();

drop trigger if exists update_investments_updated_at on public.investments;
create trigger update_investments_updated_at
before update on public.investments
for each row execute function public.update_updated_at_column();

drop trigger if exists update_reminders_updated_at on public.reminders;
create trigger update_reminders_updated_at
before update on public.reminders
for each row execute function public.update_updated_at_column();

drop trigger if exists update_tasks_updated_at on public.tasks;
create trigger update_tasks_updated_at
before update on public.tasks
for each row execute function public.update_updated_at_column();