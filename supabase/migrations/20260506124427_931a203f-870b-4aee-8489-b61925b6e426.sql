
CREATE TABLE public.subscription_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  mes_referencia text NOT NULL,
  valor numeric NOT NULL,
  vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  data_pagamento timestamptz,
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, mes_referencia)
);

CREATE INDEX idx_subscription_charges_user ON public.subscription_charges(user_id);
CREATE INDEX idx_subscription_charges_status ON public.subscription_charges(user_id, status);

ALTER TABLE public.subscription_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription_charges" ON public.subscription_charges
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription_charges" ON public.subscription_charges
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription_charges" ON public.subscription_charges
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscription_charges" ON public.subscription_charges
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_subscription_charges_updated_at
  BEFORE UPDATE ON public.subscription_charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
