import { owner,failure,RequestError,boundedBody } from '@/lib/server';
import { createClient } from '@/lib/supabase/server';
import { checkDatabase } from '@/lib/errors';
import { serviceSchema } from '@/lib/domain';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const db=await createClient();let newKey:string|undefined;
 try{
  const user=await owner(request);const bytesBody=await boundedBody(request,4*1024*1024);
  const form=await new Response(bytesBody,{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData();
  const service=serviceSchema.parse({...Object.fromEntries(form),amount:Number(form.get('amount'))});
  const {data:client,error:clientError}=await db.from('clients').select('id').eq('id',service.client_id).eq('owner',user).maybeSingle();checkDatabase(clientError);if(!client)throw new RequestError('Selecione um cliente cadastrado.');
  const {data:old,error:readError}=await db.from('services').select('photo_key,photo_type,photo_name').eq('id',service.id).eq('owner',user).maybeSingle();checkDatabase(readError);
  let key=old?.photo_key??null,type=old?.photo_type??null,name=old?.photo_name??null;
  if(form.get('remove_photo')==='true'){key=null;type=null;name=null;}
  const photo=form.get('photo');
  if(photo instanceof File&&photo.size){
   if(photo.size>3*1024*1024)throw new RequestError('A foto deve ter no máximo 3 MB.');
   const bytes=new Uint8Array(await photo.arrayBuffer());const head=Array.from(bytes.slice(0,12));
   const png=[137,80,78,71,13,10,26,10].every((v,i)=>head[i]===v),jpg=head[0]===255&&head[1]===216&&head[2]===255,webp=String.fromCharCode(...head.slice(0,4))==='RIFF'&&String.fromCharCode(...head.slice(8,12))==='WEBP';
   if(!png&&!jpg&&!webp)throw new RequestError('Escolha uma foto JPG, PNG ou WebP.');
   type=png?'image/png':jpg?'image/jpeg':'image/webp';name=photo.name.slice(0,200);newKey=user+'/'+service.id+'/'+crypto.randomUUID();
   const {error}=await db.storage.from('service-photos').upload(newKey,bytes,{contentType:type,upsert:false});if(error)throw new RequestError('Não foi possível enviar a foto. Tente novamente.',503);key=newKey;
  }
  const {error}=await db.from('services').upsert({...service,owner:user,photo_key:key,photo_type:type,photo_name:name});checkDatabase(error);newKey=undefined;
  if(old?.photo_key&&old.photo_key!==key){const {error:cleanup}=await db.storage.from('service-photos').remove([old.photo_key]);if(cleanup)console.error('Photo cleanup failed');}
  return Response.json({id:service.id});
 }catch(error){if(newKey)await db.storage.from('service-photos').remove([newKey]);return failure(error);}
}
