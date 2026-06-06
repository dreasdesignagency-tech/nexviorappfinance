-- Defense-in-depth: prevent privilege escalation by blocking any non-admin
-- from inserting/updating an 'admin' role in user_roles, even via SECURITY DEFINER paths
-- that don't validate the role value.

CREATE OR REPLACE FUNCTION public.prevent_admin_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'::public.app_role THEN
    -- Allow if no auth context (server-side seed / handle_new_user for seeded admin email)
    -- OR if the acting user is already an admin.
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'not authorized to assign admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_admin_role_escalation_trg ON public.user_roles;
CREATE TRIGGER prevent_admin_role_escalation_trg
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_role_escalation();