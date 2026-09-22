-- Execute DEPOIS de criar sua conta no Giro Certo e confirmar o e-mail.
-- Substitua SEU_EMAIL_AQUI pelo e-mail dessa conta. Não é necessário código de ativação.
do $$
declare owner_email text := 'SEU_EMAIL_AQUI'; user_id uuid;
begin
 select id into user_id from auth.users where lower(email)=lower(trim(owner_email)) and email_confirmed_at is not null;
 if user_id is null then raise exception 'Crie sua conta e confirme o e-mail antes de ativar o administrador.'; end if;
 update public.profiles set role='admin',active=true where id=user_id;
 if not found then raise exception 'Perfil não encontrado. Confira a instalação do banco.'; end if;
end $$;
