-- 1) Idempotent handle_new_user that always honors access_grants
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
  )
  ON CONFLICT (id) DO NOTHING;

  IF NEW.email = 'andreaspaimavila@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  SELECT * INTO v_grant
  FROM public.access_grants
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.user_subscriptions (user_id, subscription_status, plan_type)
    VALUES (NEW.id, 'active', COALESCE(v_grant.plan_type, 'free_access'))
    ON CONFLICT (user_id) DO UPDATE
      SET subscription_status = 'active',
          plan_type = COALESCE(EXCLUDED.plan_type, 'free_access'),
          updated_at = now();

    UPDATE public.access_grants
    SET claimed_user_id = NEW.id,
        claimed_at = COALESCE(claimed_at, now())
    WHERE id = v_grant.id;
  ELSE
    INSERT INTO public.user_subscriptions (user_id, subscription_status)
    VALUES (NEW.id, 'inactive')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure user_subscriptions has a unique constraint on user_id (required for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_subscriptions'::regclass
      AND contype = 'u'
      AND conkey = (SELECT array_agg(attnum) FROM pg_attribute
                    WHERE attrelid = 'public.user_subscriptions'::regclass
                      AND attname = 'user_id')
  ) THEN
    BEGIN
      ALTER TABLE public.user_subscriptions
        ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END$$;

-- Make sure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) RPC the client can call after login to claim a free-access grant
CREATE OR REPLACE FUNCTION public.claim_access_grant()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_grant public.access_grants%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'not_authenticated');
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'no_email');
  END IF;

  SELECT * INTO v_grant
  FROM public.access_grants
  WHERE lower(email) = v_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'no_grant');
  END IF;

  INSERT INTO public.user_subscriptions (user_id, subscription_status, plan_type)
  VALUES (v_uid, 'active', COALESCE(v_grant.plan_type, 'free_access'))
  ON CONFLICT (user_id) DO UPDATE
    SET subscription_status = 'active',
        plan_type = COALESCE(EXCLUDED.plan_type, 'free_access'),
        updated_at = now();

  UPDATE public.access_grants
  SET claimed_user_id = v_uid,
      claimed_at = COALESCE(claimed_at, now())
  WHERE id = v_grant.id;

  RETURN jsonb_build_object(
    'claimed', true,
    'plan_type', COALESCE(v_grant.plan_type, 'free_access')
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.claim_access_grant() TO authenticated;