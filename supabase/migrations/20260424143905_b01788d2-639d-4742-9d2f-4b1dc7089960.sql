
DROP FUNCTION IF EXISTS public.admin_list_members();

CREATE OR REPLACE FUNCTION public.admin_list_members()
 RETURNS TABLE(id uuid, email text, full_name text, phone text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, role app_role, banned_until timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    p.full_name,
    p.phone,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(
      (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = u.id ORDER BY (ur.role = 'admin') DESC LIMIT 1),
      'user'::public.app_role
    ) AS role,
    u.banned_until
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_user_banned(_user_id uuid, _banned boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot modify yourself';
  END IF;
  IF _banned THEN
    UPDATE auth.users SET banned_until = 'infinity'::timestamptz WHERE id = _user_id;
  ELSE
    UPDATE auth.users SET banned_until = NULL WHERE id = _user_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_user_details(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'transactions', COALESCE((
      SELECT jsonb_agg(to_jsonb(t.*))
      FROM (SELECT id, descricao, valor, tipo, categoria, data, forma_pagamento FROM public.transactions WHERE user_id = _user_id ORDER BY data DESC LIMIT 50) t
    ), '[]'::jsonb),
    'cards', COALESCE((
      SELECT jsonb_agg(to_jsonb(c.*))
      FROM (SELECT id, nome, banco, bandeira, tipo, limite, ativo FROM public.cards WHERE user_id = _user_id) c
    ), '[]'::jsonb),
    'subscriptions', COALESCE((
      SELECT jsonb_agg(to_jsonb(s.*))
      FROM (SELECT id, nome, valor, frequencia, status, data_cobranca FROM public.subscriptions WHERE user_id = _user_id) s
    ), '[]'::jsonb),
    'counts', jsonb_build_object(
      'transactions', (SELECT COUNT(*) FROM public.transactions WHERE user_id = _user_id),
      'cards', (SELECT COUNT(*) FROM public.cards WHERE user_id = _user_id),
      'subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE user_id = _user_id)
    )
  ) INTO result;

  RETURN result;
END;
$function$;
