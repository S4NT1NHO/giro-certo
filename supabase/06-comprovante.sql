begin;
alter table public.service_receipts add column if not exists signature_data text;
alter table public.service_receipts add column if not exists delivery_snapshot jsonb;
alter table public.service_receipts drop constraint if exists receipt_signature_safe;
alter table public.service_receipts add constraint receipt_signature_safe check(signature_data is null or (length(signature_data)<=140000 and signature_data ~ '^data:image/png;base64,[A-Za-z0-9+/=]+$'));
grant select(signature_data,delivery_snapshot) on public.service_receipts to authenticated;

create or replace function public.giro_delivery(vtoken text, receiver text default null, contact text default '', relationship text default '', note text default '', signature text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid; s public.services; r public.service_receipts; details jsonb;
begin
 select service_id into sid from public.service_receipts where token_hash=vtoken;
 if sid is null then return null; end if;
 select * into s from public.services where id=sid for update;
 select * into r from public.service_receipts where service_id=sid and token_hash=vtoken for update;
 if not found or r.expires_at<=now() or not exists(select 1 from public.profiles where id=s.owner and active) then return null; end if;
 details:=coalesce(r.delivery_snapshot,jsonb_build_object('id',s.id,'client',(select name from public.clients where id=s.client_id),'logo',(select logo_data from public.clients where id=s.client_id),'date',s.date,'category',s.category,'description',s.description,'photo_key',s.photo_key));
 if receiver is not null then
  if r.confirmed_at is not null then raise exception 'Recebimento já confirmado'; end if;
  if length(trim(receiver)) not between 2 and 120 or length(contact)>120 or length(relationship)>120 or length(note)>1000 or signature is null or length(signature)>140000 or signature !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$' then raise exception 'Dados ou assinatura inválidos'; end if;
  update public.service_receipts set confirmed_at=now(),receiver_name=trim(receiver),receiver_contact=contact,receiver_role=relationship,notes=note,signature_data=signature,delivery_snapshot=details where service_id=sid returning * into r;
 end if;
 return details || jsonb_build_object('expires_at',r.expires_at,'confirmed_at',r.confirmed_at,'receiver_name',r.receiver_name,'receiver_contact',r.receiver_contact,'receiver_role',r.receiver_role,'notes',r.notes,'signature_data',r.signature_data);
end $$;
revoke all on function public.giro_delivery(text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.giro_delivery(text,text,text,text,text,text) to service_role;
-- Retire the old unsigned confirmation entry point after the application update.
revoke execute on function public.giro_receive(text,text,text,text,text) from service_role;
commit;
