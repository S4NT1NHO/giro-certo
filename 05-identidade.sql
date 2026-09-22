begin;
alter table public.clients add column if not exists logo_data text;
alter table public.clients drop constraint if exists clients_logo_safe;
alter table public.clients add constraint clients_logo_safe check(logo_data is null or (length(logo_data)<=280000 and logo_data ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$'));
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
 return jsonb_build_object('client',client_name,'logo',(select logo_data from public.clients where id=s.client_id),'date',s.date,'category',s.category,'description',s.description,'expires_at',r.expires_at);
end $$;
revoke all on function public.giro_receive(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.giro_receive(text,text,text,text,text) to service_role;
commit;
