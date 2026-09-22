import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { requireAccount,limitAttempts,passwordSchema } from '@/lib/accounts';
import { failure,jsonBody,verifyOrigin,RequestError } from '@/lib/server';
import { checkDatabase } from '@/lib/errors';
export async function POST(request:Request){try{
 verifyOrigin(request);const account=await requireAccount();const input=z.object({current:z.string().min(1).max(128),password:passwordSchema}).parse(await jsonBody(request));
 await limitAttempts(request,'password:'+account.id);
 const db=await createClient();const {error}=await db.auth.signInWithPassword({email:account.email,password:input.current});
 if(error)throw new RequestError('A senha atual está incorreta.');
 const admin=adminClient();
 const {error:invalidation}=await admin.from('profiles').update({sessions_valid_after:Math.floor(Date.now()/1000)+1}).eq('id',account.id);checkDatabase(invalidation);
 const {error:updateError}=await db.auth.updateUser({password:input.password});
 if(updateError)throw new RequestError('Não foi possível alterar a senha. Confira os requisitos da nova senha.');
 await db.auth.signOut({scope:'global'});return Response.json({ok:true});
}catch(error){return failure(error);}}
