import { owner,failure,RequestError } from '@/lib/server';
import { createClient } from '@/lib/supabase/server';
import { checkDatabase } from '@/lib/errors';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const user=await owner();const id=z.string().uuid().parse((await params).id);const db=await createClient();
 const {data:row,error}=await db.from('services').select('photo_key,photo_type').eq('id',id).eq('owner',user).maybeSingle();checkDatabase(error);
 if(!row?.photo_key)throw new RequestError('Foto não encontrada.',404);
 const {data:photo,error:photoError}=await db.storage.from('service-photos').download(row.photo_key);
 if(photoError||!photo)throw new RequestError('Foto indisponível.',404);
 return new Response(photo,{headers:{'Content-Type':row.photo_type??'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
}catch(error){return failure(error);}}
