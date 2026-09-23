import {randomBytes,createHash} from 'node:crypto';
import {owner,failure,jsonBody,RequestError} from '@/lib/server';
import {deliveryPhoto} from '@/lib/delivery-server';
import {createClient} from '@/lib/supabase/server';
import {checkDatabase} from '@/lib/errors';
import {z} from 'zod';
export async function GET(request:Request){try{
 const user=await owner();const id=z.string().uuid().parse(new URL(request.url).searchParams.get('id'));const db=await createClient();
 const {data:s,error}=await db.from('services').select('id,client_id,date,category,description,photo_key').eq('id',id).eq('owner',user).maybeSingle();checkDatabase(error);if(!s)throw new RequestError('Serviço não encontrado.',404);
 const {data:r,error:re}=await db.from('service_receipts').select('confirmed_at,receiver_name,receiver_contact,receiver_role,notes,signature_data,delivery_snapshot').eq('service_id',id).eq('owner',user).maybeSingle();checkDatabase(re);if(!r?.confirmed_at)throw new RequestError('Aguarde a confirmação do cliente.',409);
 const {data:c,error:ce}=await db.from('clients').select('name,logo_data').eq('id',s.client_id).eq('owner',user).single();checkDatabase(ce);
 const {delivery_snapshot,...receipt}=r;
 return Response.json(await deliveryPhoto({...s,client:c?.name,logo:c?.logo_data,...(delivery_snapshot??{}),...receipt}),{headers:{'Cache-Control':'private, no-store'}});
}catch(e){return failure(e);}}
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
