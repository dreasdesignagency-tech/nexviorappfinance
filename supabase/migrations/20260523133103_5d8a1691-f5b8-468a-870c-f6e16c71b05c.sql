
-- Extend user_subscriptions
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signup_source text;

-- launch_signups
CREATE TABLE IF NOT EXISTS public.launch_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  phone text,
  signup_source text NOT NULL DEFAULT 'instagram_launch',
  created_from_launch boolean NOT NULL DEFAULT true,
  founder_user boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.launch_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own launch signup"
  ON public.launch_signups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all launch signups"
  ON public.launch_signups FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage launch signups"
  ON public.launch_signups FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- launch_settings (singleton row id=1)
CREATE TABLE IF NOT EXISTS public.launch_settings (
  id integer PRIMARY KEY DEFAULT 1,
  is_open boolean NOT NULL DEFAULT true,
  max_slots integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT launch_settings_singleton CHECK (id = 1)
);

INSERT INTO public.launch_settings (id, is_open, max_slots)
VALUES (1, true, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.launch_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read launch settings"
  ON public.launch_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage launch settings"
  ON public.launch_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update has_active_subscription to include founder plan
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND (
        subscription_status IN ('active', 'trialing', 'beta')
        OR plan_type IN ('legacy', 'founder', 'free_access', 'beta')
        OR is_founder = true
      )
  )
$function$;

-- register_founder_user RPC
CREATE OR REPLACE FUNCTION public.register_founder_user(p_source text DEFAULT 'instagram_launch')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_full_name text;
  v_phone text;
  v_settings public.launch_settings%ROWTYPE;
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  SELECT email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone'
    INTO v_email, v_full_name, v_phone
  FROM auth.users WHERE id = v_uid;

  -- Check launch open + slot limit
  SELECT * INTO v_settings FROM public.launch_settings WHERE id = 1;
  IF FOUND AND v_settings.is_open = false THEN
    -- allow if user already has founder record (idempotent)
    IF NOT EXISTS (SELECT 1 FROM public.launch_signups WHERE user_id = v_uid) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'launch_closed');
    END IF;
  END IF;

  IF v_settings.max_slots IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.launch_signups;
    IF v_count >= v_settings.max_slots
       AND NOT EXISTS (SELECT 1 FROM public.launch_signups WHERE user_id = v_uid) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'no_slots');
    END IF;
  END IF;

  -- Profile upsert
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (v_uid, COALESCE(v_full_name, ''), COALESCE(v_phone, ''))
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone);

  -- Subscription upsert: do not downgrade paid users
  INSERT INTO public.user_subscriptions (user_id, subscription_status, plan_type, is_founder, signup_source)
  VALUES (v_uid, 'active', 'founder', true, p_source)
  ON CONFLICT (user_id) DO UPDATE
    SET is_founder = true,
        signup_source = COALESCE(public.user_subscriptions.signup_source, EXCLUDED.signup_source),
        subscription_status = CASE
          WHEN public.user_subscriptions.subscription_status IN ('active','trialing') THEN public.user_subscriptions.subscription_status
          ELSE 'active'
        END,
        plan_type = CASE
          WHEN public.user_subscriptions.plan_type IN ('mensal','anual','legacy') THEN public.user_subscriptions.plan_type
          ELSE 'founder'
        END,
        updated_at = now();

  -- Track signup
  INSERT INTO public.launch_signups (user_id, email, full_name, phone, signup_source)
  VALUES (v_uid, v_email, v_full_name, v_phone, p_source)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'plan_type', 'founder', 'is_founder', true);
END;
$$;

-- admin_launch_stats
CREATE OR REPLACE FUNCTION public.admin_launch_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings public.launch_settings%ROWTYPE;
  v_total int;
  v_24h int;
  v_7d int;
  v_list jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_settings FROM public.launch_settings WHERE id = 1;

  SELECT count(*) INTO v_total FROM public.launch_signups;
  SELECT count(*) INTO v_24h FROM public.launch_signups WHERE created_at >= now() - interval '24 hours';
  SELECT count(*) INTO v_7d FROM public.launch_signups WHERE created_at >= now() - interval '7 days';

  SELECT COALESCE(jsonb_agg(to_jsonb(x.*) ORDER BY x.created_at DESC), '[]'::jsonb) INTO v_list
  FROM (
    SELECT ls.id, ls.user_id, ls.email, ls.full_name, ls.phone, ls.signup_source, ls.created_at
    FROM public.launch_signups ls
    ORDER BY ls.created_at DESC
    LIMIT 500
  ) x;

  RETURN jsonb_build_object(
    'total', v_total,
    'last_24h', v_24h,
    'last_7d', v_7d,
    'is_open', COALESCE(v_settings.is_open, true),
    'max_slots', v_settings.max_slots,
    'slots_remaining', CASE WHEN v_settings.max_slots IS NULL THEN NULL ELSE GREATEST(v_settings.max_slots - v_total, 0) END,
    'founders', v_list
  );
END;
$$;

-- admin_set_launch_open
CREATE OR REPLACE FUNCTION public.admin_set_launch_open(p_open boolean, p_max_slots integer DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.launch_settings
     SET is_open = p_open,
         max_slots = p_max_slots,
         updated_at = now()
   WHERE id = 1;
END;
$$;

-- admin_revoke_founder
CREATE OR REPLACE FUNCTION public.admin_revoke_founder(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.user_subscriptions
     SET is_founder = false,
         subscription_status = CASE
           WHEN plan_type = 'founder' THEN 'inactive'
           ELSE subscription_status
         END,
         plan_type = CASE
           WHEN plan_type = 'founder' THEN NULL
           ELSE plan_type
         END,
         updated_at = now()
   WHERE user_id = _user_id;

  DELETE FROM public.launch_signups WHERE user_id = _user_id;
END;
$$;

-- Public-readable lightweight stats (used in landing page slot counter)
CREATE OR REPLACE FUNCTION public.public_launch_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'is_open', COALESCE((SELECT is_open FROM public.launch_settings WHERE id = 1), true),
    'max_slots', (SELECT max_slots FROM public.launch_settings WHERE id = 1),
    'total', (SELECT count(*) FROM public.launch_signups)
  );
$$;
