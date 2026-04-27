-- Lock down SECURITY DEFINER functions
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.set_updated_at() from anon, authenticated, public;
-- set_updated_at doesn't need definer; but trigger functions still execute as table owner via trigger