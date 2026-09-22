import { requireAdmin,passwordSchema,usernameSchema } from '@/lib/accounts';
import { adminClient } from '@/lib/supabase/admin';
import { checkDatabase } from '@/lib/errors';
import { failure,jsonBody,verifyOrigin,RequestError } from '@/lib/server';
import { z } from 'zod';
const schema=z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(120),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),username:usernameSchema,password:passwordSchema.optional(),active:z.boolean()});
export const dynamic='force-dynamic';
export async function GET(){try{
 await requireAdmin();const db=adminClient();const result:unknown[]=[];
 for(let from=0;;from+=500){const {data,error}=await db.from('profiles').select('id,name,email,username,role,active,created_at').order('name').order('id').range(from,from+499);checkDatabase(error);result.push(...(data??[]));if((data?.length??0)<500)break;}
 return Response.json(result,{headers:{'Cache-Control':'private, no-store'}});
}catch(error){return failure(error);}}
export async function POST(request:Request){try{
 verifyOrigin(request);const admin=await requireAdmin();const input=schema.parse(await jsonBody(request));const db=adminClient();
 const {data:existing,error:readError}=await db.from('profiles').select('*').eq('id',input.id).maybeSingle();checkDatabase(readError);
 if(existing?.role==='admin'&&(existing.id!==admin.id||!input.active||input.password))throw new RequestError('Este administrador não pode ser alterado. Use Alterar minha senha para trocar sua senha.',403);
 if(existing&&existing.email!==input.email)throw new RequestError('O e-mail deste cadastro não pode ser alterado.');
 if(existing){
  if(input.password||!input.active){const {error}=await db.from('profiles').update({sessions_valid_after:Math.floor(Date.now()/1000)+1}).eq('id',existing.id);checkDatabase(error);}
  const {error}=await db.from('profiles').update({name:input.name,username:input.username,active:input.active}).eq('id',existing.id);checkDatabase(error);
  if(input.password){const {error:resetError}=await db.auth.admin.updateUserById(existing.id,{password:input.password});if(resetError)throw new RequestError('O cadastro foi atualizado, mas a senha não pôde ser redefinida. Confira a nova senha e tente novamente.');}
  return Response.json({id:existing.id});
 }
 if(!input.password)throw new RequestError('Defina a senha inicial.');
 const {data,error}=await db.auth.admin.createUser({email:input.email,password:input.password,email_confirm:true,user_metadata:{name:input.name,username:input.username}});
 if(error||!data.user)throw new RequestError('Não foi possível cadastrar. Confira o e-mail, o usuário e a senha.');
 if(!input.active){const {error:activeError}=await db.from('profiles').update({active:false}).eq('id',data.user.id);if(activeError){await db.auth.admin.deleteUser(data.user.id);checkDatabase(activeError);}}
 return Response.json({id:data.user.id});
}catch(error){return failure(error);}}
