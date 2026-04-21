ALTER TABLE public.transactions
  ADD COLUMN forma_pagamento TEXT,
  ADD COLUMN parcelado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN numero_parcelas INTEGER,
  ADD COLUMN parcela_atual INTEGER,
  ADD COLUMN recorrente BOOLEAN NOT NULL DEFAULT false;