-- Giro Certo: execute após 01-instalar.sql. Pode ser reaplicado.
begin;
create or replace function giro_private.active_user() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.active
 and coalesce((auth.jwt()->>'iat')::bigint,0)>=p.sessions_valid_after
 and exists(select 1 from auth.sessions s where s.id=(auth.jwt()->>'session_id')::uuid and s.user_id=p.id and extract(epoch from s.created_at)>=p.sessions_valid_after));
$$;
create or replace function public.giro_session_valid() returns boolean language sql stable security definer set search_path='' as $$ select giro_private.active_user(); $$;
revoke all on function public.giro_session_valid() from public,anon;
grant execute on function public.giro_session_valid() to authenticated;
commit;
