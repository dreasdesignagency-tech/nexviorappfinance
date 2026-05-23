
REVOKE EXECUTE ON FUNCTION public.admin_revoke_access(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_launch_open(boolean, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_launch_stats() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_founder(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_members() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_banned(uuid, boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_details(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_grant_access(text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_access_grants() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.public_launch_status() FROM anon;
