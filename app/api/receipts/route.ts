import {randomBytes,createHash} from 'node:crypto';
import {owner,failure,jsonBody} from '@/lib/server';
import {createClient} from '@/lib/supabase/server';
import {checkDatabase} from '@/lib/errors';
import {z} from 'zod';
export async function POST(request:Request){try{
 await owner(request);const {id,revoke}=z.object({id:z.string().uuid(),revoke:z.boolean().optional()}).parse(await jsonBody(request));
 const token=randomBytes(32).toString('hex');const db=await createClient();
 const {data:service,error:lookupError}=await db.from('services').select('client_id').eq('id',id).maybeSingle();checkDatabase(lookupError);
 const {data:client}=service?await db.from('clients').select('name').eq('id',service.client_id).maybeSingle():{data:null};
 const slug=(client?.name??'empresa').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'empresa';
 const link=new URL('/receber',request.url);link.searchParams.set('empresa',slug+'-giro-certo');
 const {error}=await db.rpc('giro_receipt_link',{sid:id,token:revoke?null:createHash('sha256').update(token).digest('hex')});checkDatabase(error);
 return Response.json({url:revoke?null:link.toString()+'#'+token},{headers:{'Cache-Control':'no-store'}});
}catch(e){return failure(e);}}
