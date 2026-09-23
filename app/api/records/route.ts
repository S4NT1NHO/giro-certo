import { owner,failure,jsonBody,RequestError } from '@/lib/server';
import { createClient } from '@/lib/supabase/server';
import { checkDatabase } from '@/lib/errors';
import { clientSchema,expenseSchema } from '@/lib/domain';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function GET(){try{
 const user=await owner();const db=await createClient();
 async function all(table:'clients'|'services'|'expenses',columns:string,order:string){
  const result:Record<string,unknown>[]=[];
  for(let start=0;;start+=500){const {data,error}=await db.from(table).select(columns).eq('owner',user).order(order,{ascending:table==='clients'}).order('id').range(start,start+499);checkDatabase(error);result.push(...(data??[]) as unknown as Record<string,unknown>[]);if((data?.length??0)<500)break;}
  return result;
 }
 const [clients,services,expenses]=await Promise.all([all('clients','id,name,phone,address,notes,logo_data','name'),all('services','id,client_id,date,category,description,amount,photo_key,service_receipts(service_id,expires_at,confirmed_at,receiver_name,receiver_contact,receiver_role,notes)','date'),all('expenses','id,date,category,description,amount','date')]);
 return Response.json({clients,services:services.map(({photo_key,service_receipts,...row})=>({...row,has_photo:!!photo_key,receipt:service_receipts})),expenses},{headers:{'Cache-Control':'private, no-store'}});
}catch(error){return failure(error);}}
export async function POST(request:Request){try{
 const user=await owner(request);const input=z.object({kind:z.enum(['client','expense'])}).passthrough().parse(await jsonBody(request));
 const table=input.kind==='client'?'clients':'expenses';const value=input.kind==='client'?clientSchema.parse(input):expenseSchema.parse(input);
 const db=await createClient();const {error}=await db.from(table).upsert({...value,owner:user});checkDatabase(error);return Response.json({id:value.id});
}catch(error){return failure(error);}}
export async function DELETE(request:Request){try{
 const user=await owner(request);const url=new URL(request.url);const kind=z.enum(['client','service','expense']).parse(url.searchParams.get('kind'));const id=z.string().uuid().parse(url.searchParams.get('id'));
 const table=({client:'clients',service:'services',expense:'expenses'} as const)[kind];const db=await createClient();
 const {data,error}=await db.from(table).delete().eq('id',id).eq('owner',user).select('*').maybeSingle();checkDatabase(error);if(!data)throw new RequestError('Registro não encontrado.',404);
 if(kind==='service'&&data.photo_key){const {error:cleanup}=await db.storage.from('service-photos').remove([data.photo_key]);if(cleanup)console.error('Photo cleanup failed');}
 return Response.json({ok:true});
}catch(error){return failure(error);}}
