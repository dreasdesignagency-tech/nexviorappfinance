ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS cartao_id uuid REFERENCES public.cards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_cartao_id ON public.transactions(cartao_id);