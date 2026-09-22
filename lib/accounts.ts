import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { RequestError,checkDatabase } from '@/lib/errors';
export type Account={id:string;email:string;name:string;username:string;role:'admin'|'user';active:boolean;sessions_valid_after:number;created_at:string};
export const usernameSchema=z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,40}$/,'Use de 3 a 40 letras sem acentos, números, pontos, traços ou sublinhados.');
export const passwordSchema=z.string().min(10,'A senha precisa ter pelo menos 10 caracteres.').max(128,'Use no máximo 128 caracteres.');
export async function currentAccount(){
 const db=await createClient();const {data:{user},error}=await db.auth.getUser();if(error||!user)return null;
 const {data:profile,error:profileError}=await db.from('profiles').select('*').eq('id',user.id).maybeSingle();checkDatabase(profileError);
 if(!profile?.active)return null;
 const {data:claims,error:claimsError}=await db.auth.getClaims();
 if(claimsError||Number(claims?.claims.iat??0)<profile.sessions_valid_after)return null;
 const {data:valid,error:sessionError}=await db.rpc('giro_session_valid');checkDatabase(sessionError);if(!valid)return null;
 return profile as Account;
}
export async function requireAccount(){const account=await currentAccount();if(!account)throw new RequestError('Entre na sua conta para acessar seus registros.',401);return account;}
export async function requireAdmin(){const account=await requireAccount();if(account.role!=='admin')throw new RequestError('Somente o administrador pode gerenciar usuários.',403);return account;}
export async function limitAttempts(request:Request,identifier:string){
 const db=adminClient();const ip=request.headers.get('x-vercel-forwarded-for')??request.headers.get('x-forwarded-for')?.split(',')[0]??'local';
 for(const [value,max] of [['ip:'+ip,100],['user:'+identifier,10]] as const){
  const {data,error}=await db.rpc('giro_limit_attempts',{attempt_key:createHash('sha256').update(value).digest('hex'),attempt_limit:max});
  checkDatabase(error);if(!data)throw new RequestError('Muitas tentativas. Aguarde 15 minutos e tente novamente.',429);
 }
}
