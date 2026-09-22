begin;
create table if not exists public.service_receipts (
 service_id uuid primary key references public.services(id) on delete cascade, owner uuid not null references public.profiles(id),
 token_hash text not null unique, expires_at timestamptz not null, confirmed_at timestamptz,
 receiver_name text, receiver_contact text, receiver_role text, notes text,
 check(receiver_name is null or length(receiver_name) between 2 and 120),
 check(receiver_contact is null or length(receiver_contact)<=120),check(receiver_role is null or length(receiver_role)<=120),check(notes is null or length(notes)<=1000)
);
alter table public.service_receipts enable row level security;
revoke all on public.service_receipts from anon,authenticated;
grant select(service_id,owner,expires_at,confirmed_at,receiver_name,receiver_contact,receiver_role,notes) on public.service_receipts to authenticated;
grant all on public.service_receipts to service_role;
drop policy if exists receipts_own on public.service_receipts;
create policy receipts_own on public.service_receipts for select to authenticated using(owner=auth.uid() and giro_private.active_user());
create or replace function public.giro_receipt_link(sid uuid, token text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.services where id=sid and owner=auth.uid() and giro_private.active_user() for update;
 if not found then raise exception 'Serviço não encontrado'; end if;
 if exists(select 1 from public.service_receipts where service_id=sid and confirmed_at is not null) then raise exception 'Serviço já confirmado'; end if;
 if token is null then update public.service_receipts set expires_at=now() where service_id=sid; return; end if;
 if token !~ '^[a-f0-9]{64}$' then raise exception 'Token inválido'; end if;
 insert into public.service_receipts(service_id,owner,token_hash,expires_at) values(sid,auth.uid(),token,now()+interval '72 hours')
 on conflict(service_id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at;
end $$;
revoke all on function public.giro_receipt_link(uuid,text) from public,anon;
grant execute on function public.giro_receipt_link(uuid,text) to authenticated;
create or replace function public.giro_receive(token text, receiver text default null, contact text default '', relationship text default '', note text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid; s public.services; r public.service_receipts; client_name text;
begin
 select service_id into sid from public.service_receipts where token_hash=token;
 if sid is null then return null; end if;
 select * into s from public.services where id=sid for update;
 select * into r from public.service_receipts where service_id=sid and token_hash=token for update;
 if not found or r.expires_at<=now() or r.confirmed_at is not null or not exists(select 1 from public.profiles where id=s.owner and active) then return null; end if;
 if receiver is not null then
 if length(trim(receiver)) not between 2 and 120 or length(contact)>120 or length(relationship)>120 or length(note)>1000 then raise exception 'Dados inválidos'; end if;
 update public.service_receipts set confirmed_at=now(),receiver_name=trim(receiver),receiver_contact=contact,receiver_role=relationship,notes=note where service_id=sid;
 return jsonb_build_object('confirmed',true);
 end if;
 select name into client_name from public.clients where id=s.client_id;
 return jsonb_build_object('client',client_name,'date',s.date,'category',s.category,'description',s.description,'expires_at',r.expires_at);
end $$;
revoke all on function public.giro_receive(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.giro_receive(text,text,text,text,text) to service_role;
create or replace function giro_private.receipt_protect() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.service_receipts where service_id=old.id and confirmed_at is not null) then raise exception 'Serviço confirmado: preserve o comprovante e registre um novo serviço.'; end if;
 update public.service_receipts set expires_at=now() where service_id=old.id;
 return new;
end $$;
drop trigger if exists receipt_protect on public.services;
create trigger receipt_protect before update on public.services for each row execute function giro_private.receipt_protect();
commit;
