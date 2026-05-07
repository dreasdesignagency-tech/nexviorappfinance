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
        OR plan_type = 'legacy'
      )
  )
$function$;