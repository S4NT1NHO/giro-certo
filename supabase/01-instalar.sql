-- Giro Certo: execute uma vez no SQL Editor de um projeto Supabase novo.
-- Não altera os dados do aplicativo hospedado anteriormente.
begin;
create schema if not exists giro_private;
revoke all on schema giro_private from public, anon, authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (length(name) between 1 and 120),
 username text not null unique check (username ~ '^[a-z0-9._-]{3,40}$'),
 email text not null unique,
 role text not null default 'user' check (role in ('admin','user')),
 active boolean not null default true,
 sessions_valid_after bigint not null default 0,
 created_at timestamptz not null default now()
);
create function giro_private.new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,name,username,email)
 values(new.id,trim(new.raw_user_meta_data->>'name'),lower(trim(new.raw_user_meta_data->>'username')),lower(new.email));
 return new;
end $$;
create trigger giro_new_user after insert on auth.users for each row execute function giro_private.new_user();
create function giro_private.sync_email() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.profiles set email=lower(new.email) where id=new.id; return new; end $$;
create trigger giro_sync_email after update of email on auth.users for each row execute function giro_private.sync_email();

create function giro_private.active_user() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.active and coalesce((auth.jwt()->>'iat')::bigint,0)>=p.sessions_valid_after);
$$;
create function giro_private.admin_user() returns boolean language sql stable security definer set search_path='' as $$
 select giro_private.active_user() and exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function giro_private.new_user(),giro_private.sync_email(),giro_private.active_user(),giro_private.admin_user() from public;
grant usage on schema giro_private to authenticated;
grant execute on function giro_private.active_user(),giro_private.admin_user() to authenticated;

create table public.clients (
 id uuid primary key, owner uuid not null default auth.uid() references public.profiles(id),
 name text not null check(length(name) between 1 and 120), phone text not null default '' check(length(phone)<=30),
 address text not null default '' check(length(address)<=300), notes text not null default '' check(length(notes)<=2000),
 unique(id,owner)
);
create table public.services (
 id uuid primary key,owner uuid not null default auth.uid() references public.profiles(id),
 client_id uuid not null,date date not null,category text not null check(category in ('Cartório','Banco','Entrega','Outro')),
 description text not null check(length(description) between 1 and 2000),amount integer not null default 0 check(amount between 0 and 999999999),
 photo_key text,photo_type text,photo_name text,
 foreign key(client_id,owner) references public.clients(id,owner),
 check(photo_key is null or photo_key like owner::text||'/'||id::text||'/%')
);
create table public.expenses (
 id uuid primary key,owner uuid not null default auth.uid() references public.profiles(id),date date not null,
 category text not null check(category in ('Combustível','Peças','Manutenção','Outros')),
 description text not null default '' check(length(description)<=2000),amount integer not null check(amount between 1 and 999999999)
);
create index clients_owner on public.clients(owner);
create index services_owner_date on public.services(owner,date);
create index services_client on public.services(client_id);
create index expenses_owner_date on public.expenses(owner,date);
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.expenses enable row level security;
revoke all on public.profiles,public.clients,public.services,public.expenses from anon,authenticated;
grant select on public.profiles to authenticated;
grant select,insert,update,delete on public.clients,public.services,public.expenses to authenticated;
grant all on public.profiles,public.clients,public.services,public.expenses to service_role;
create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()) or (select giro_private.admin_user()));
create policy clients_own on public.clients for all to authenticated using(owner=(select auth.uid()) and (select giro_private.active_user())) with check(owner=(select auth.uid()) and (select giro_private.active_user()));
create policy services_own on public.services for all to authenticated using(owner=(select auth.uid()) and (select giro_private.active_user())) with check(owner=(select auth.uid()) and (select giro_private.active_user()));
create policy expenses_own on public.expenses for all to authenticated using(owner=(select auth.uid()) and (select giro_private.active_user())) with check(owner=(select auth.uid()) and (select giro_private.active_user()));

create table giro_private.auth_attempts(key text primary key,attempts integer not null,expires_at timestamptz not null);
create function public.giro_limit_attempts(attempt_key text,attempt_limit integer) returns boolean language plpgsql security definer set search_path='' as $$
declare total integer;
begin
 delete from giro_private.auth_attempts where expires_at<now();
 insert into giro_private.auth_attempts(key,attempts,expires_at) values(attempt_key,1,now()+interval '15 minutes')
 on conflict(key) do update set attempts=giro_private.auth_attempts.attempts+1 returning attempts into total;
 return total<=attempt_limit;
end $$;
revoke all on function public.giro_limit_attempts(text,integer) from public,anon,authenticated;
grant execute on function public.giro_limit_attempts(text,integer) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('service-photos','service-photos',false,3145728,array['image/jpeg','image/png','image/webp']);
create policy giro_photos_read on storage.objects for select to authenticated using(bucket_id='service-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and (select giro_private.active_user()));
create policy giro_photos_insert on storage.objects for insert to authenticated with check(bucket_id='service-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and (select giro_private.active_user()));
create policy giro_photos_delete on storage.objects for delete to authenticated using(bucket_id='service-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and (select giro_private.active_user()));
commit;
