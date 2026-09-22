import { createClient } from '@/lib/supabase/server';
import { failure,verifyOrigin,RequestError } from '@/lib/server';
export async function POST(request:Request){try{verifyOrigin(request);const db=await createClient();const {error}=await db.auth.signOut({scope:'local'});if(error)throw new RequestError('Não foi possível sair. Tente novamente.',503);return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch(error){return failure(error);}}
