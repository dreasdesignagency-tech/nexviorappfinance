-- Tabela de acessos liberados por email (antes ou depois do cadastro)
CREATE TABLE public.access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  plan_type text NOT NULL DEFAULT 'free_access',
  note text,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  claimed_user_id uuid,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage access_grants"
  ON public.access_grants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER access_grants_updated_at
  BEFORE UPDATE ON public.access_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_access_grants_email_lower ON public.access_grants (lower(email));

-- Atualiza handle_new_user para aplicar acesso liberado automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_grant public.access_grants%ROWTYPE;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );

  IF NEW.email = 'andreaspaimavila@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  -- Verifica se há liberação de acesso para esse email
  SELECT * INTO v_grant
  FROM public.access_grants
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.user_subscriptions (user_id, subscription_status, plan_type)
    VALUES (NEW.id, 'active', COALESCE(v_grant.plan_type, 'free_access'));

    UPDATE public.access_grants
    SET claimed_user_id = NEW.id,
        claimed_at = now()
    WHERE id = v_grant.id;
  ELSE
    INSERT INTO public.user_subscriptions (user_id, subscription_status)
    VALUES (NEW.id, 'inactive');
  END IF;

  RETURN NEW;
END;
$function$;

-- Função para o admin liberar acesso por email (se a pessoa já tem conta, ativa na hora)
CREATE OR REPLACE FUNCTION public.admin_grant_access(_email text, _plan_type text DEFAULT 'free_access', _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_email text := lower(trim(_email));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email obrigatório';
  END IF;

  -- Upsert do grant
  INSERT INTO public.access_grants (email, plan_type, note, granted_by)
  VALUES (v_email, COALESCE(_plan_type, 'free_access'), _note, auth.uid())
  ON CONFLICT (email) DO UPDATE
    SET plan_type = EXCLUDED.plan_type,
        note = COALESCE(EXCLUDED.note, public.access_grants.note),
        granted_by = EXCLUDED.granted_by,
        granted_at = now(),
        updated_at = now();

  -- Se o usuário já existe, ativar imediatamente
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, subscription_status, plan_type)
    VALUES (v_user_id, 'active', COALESCE(_plan_type, 'free_access'))
    ON CONFLICT (user_id) DO UPDATE
      SET subscription_status = 'active',
          plan_type = COALESCE(_plan_type, 'free_access'),
          updated_at = now();

    UPDATE public.access_grants
    SET claimed_user_id = v_user_id,
        claimed_at = COALESCE(claimed_at, now())
    WHERE email = v_email;
  END IF;

  RETURN jsonb_build_object(
    'email', v_email,
    'plan_type', COALESCE(_plan_type, 'free_access'),
    'existing_user_id', v_user_id,
    'activated_immediately', v_user_id IS NOT NULL
  );
END;
$function$;

-- Garante unique constraint em user_subscriptions(user_id) para o ON CONFLICT funcionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_subscriptions_user_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- Função para revogar acesso liberado
CREATE OR REPLACE FUNCTION public.admin_revoke_access(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_email text := lower(trim(_email));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.access_grants WHERE lower(email) = v_email;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    UPDATE public.user_subscriptions
    SET subscription_status = 'inactive',
        updated_at = now()
    WHERE user_id = v_user_id AND plan_type = 'free_access';
  END IF;
END;
$function$;

-- Lista grants para o admin
CREATE OR REPLACE FUNCTION public.admin_list_access_grants()
RETURNS SETOF public.access_grants
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.access_grants ORDER BY granted_at DESC;
END;
$function$;