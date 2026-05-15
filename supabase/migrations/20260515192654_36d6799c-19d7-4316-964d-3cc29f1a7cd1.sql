
CREATE TABLE IF NOT EXISTS public.installment_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  installment_id UUID NOT NULL,
  parcela_numero INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  data_pagamento TIMESTAMPTZ NOT NULL DEFAULT now(),
  transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (installment_id, parcela_numero)
);

CREATE INDEX IF NOT EXISTS idx_installment_payments_user ON public.installment_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_installment ON public.installment_payments(installment_id);

ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own installment_payments"
  ON public.installment_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installment_payments"
  ON public.installment_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installment_payments"
  ON public.installment_payments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own installment_payments"
  ON public.installment_payments FOR DELETE
  USING (auth.uid() = user_id);
