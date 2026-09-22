import {z} from 'zod';
import {createClient} from '@/lib/supabase/server';
import {limitAttempts} from '@/lib/accounts';
import {failure,jsonBody,verifyOrigin,RequestError} from '@/lib/server';
export async function POST(request:Request){try{verifyOrigin(request);const input=z.object({email:z.string().trim().email().max(254).transform(v=>v.toLowerCase())}).parse(await jsonBody(request));await limitAttempts(request,'resend:'+input.email);const db=await createClient();const {error}=await db.auth.resend({type:'signup',email:input.email,options:{emailRedirectTo:new URL('/auth/callback',request.url).toString()}});if(error)throw new RequestError('O envio está indisponível ou temporariamente limitado. Tente novamente mais tarde.',429);return Response.json({ok:true});}catch(error){return failure(error);}}
