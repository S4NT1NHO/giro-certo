import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { passwordSchema,usernameSchema,limitAttempts } from '@/lib/accounts';
import { failure,jsonBody,verifyOrigin,RequestError } from '@/lib/server';
export async function POST(request:Request){try{
 verifyOrigin(request);
 const input=z.object({name:z.string().trim().min(1,'Informe seu nome.').max(120),email:z.string().trim().email('Informe um e-mail válido.').max(254).transform(v=>v.toLowerCase()),username:usernameSchema,password:passwordSchema}).parse(await jsonBody(request));
 await limitAttempts(request,'register:'+input.email);
 const db=await createClient();
 const {data,error}=await db.auth.signUp({email:input.email,password:input.password,options:{data:{name:input.name,username:input.username},emailRedirectTo:new URL('/auth/callback',request.url).toString()}});
 if(error)throw new RequestError(error.code==='over_email_send_rate_limit'?'O envio de e-mails está temporariamente limitado. Aguarde e tente novamente.':error.code==='user_already_exists'?'Este e-mail já possui uma conta. Entre com sua senha.':'Não foi possível criar a conta. Confira os campos e escolha outro nome de usuário.',400);
 return Response.json({ok:true,confirmationRequired:!data.session},{headers:{'Cache-Control':'no-store'}});
}catch(error){return failure(error);}}
