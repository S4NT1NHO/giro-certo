import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { limitAttempts,currentAccount } from '@/lib/accounts';
import { failure,jsonBody,verifyOrigin,RequestError } from '@/lib/server';
import { checkDatabase } from '@/lib/errors';
export async function POST(request:Request){try{
 verifyOrigin(request);
 const input=z.object({username:z.string().trim().toLowerCase().min(1).max(254),password:z.string().min(1).max(128)}).parse(await jsonBody(request));
 await limitAttempts(request,input.username);let email=input.username;
 if(!email.includes('@')){const {data,error}=await adminClient().from('profiles').select('email').eq('username',email).maybeSingle();checkDatabase(error);email=data?.email??'invalid-account@giro-certo.invalid';}
 const db=await createClient();const {error}=await db.auth.signInWithPassword({email,password:input.password});
 if(error)throw new RequestError(error.code==='email_not_confirmed'?'Confirme seu e-mail para entrar. Confira também a pasta de spam.':'Usuário ou senha incorretos.',401);
 if(!await currentAccount()){await db.auth.signOut({scope:'local'});throw new RequestError('Seu acesso está desativado ou a sessão foi encerrada. Tente entrar novamente ou fale com o responsável.',403);}
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}catch(error){return failure(error);}}
