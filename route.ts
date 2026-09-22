import {owner,failure,boundedBody,RequestError} from '@/lib/server';
import {createClient} from '@/lib/supabase/server';
import {checkDatabase} from '@/lib/errors';
import {z} from 'zod';
export async function POST(request:Request){try{
 const user=await owner(request);const bytes=await boundedBody(request,220000);const form=await new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData();const id=z.string().uuid().parse(form.get('id'));
 let logo:string|null=null;
 if(form.get('remove')!=='true'){
 const file=form.get('logo');if(!(file instanceof File)||!file.size||file.size>200000)throw new RequestError('Escolha uma logo PNG, JPG ou WebP de até 200 KB.');
 const b=Buffer.from(await file.arrayBuffer());const png=b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const jpg=b[0]===255&&b[1]===216&&b[2]===255;const webp=b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';if(!png&&!jpg&&!webp)throw new RequestError('Formato de imagem inválido. Use PNG, JPG ou WebP.');
 logo='data:image/'+(png?'png':jpg?'jpeg':'webp')+';base64,'+b.toString('base64');
 }
 const db=await createClient();const {data,error}=await db.from('clients').update({logo_data:logo}).eq('id',id).eq('owner',user).select('id').maybeSingle();checkDatabase(error);if(!data)throw new RequestError('Cliente não encontrado.',404);
 return Response.json({ok:true});
}catch(e){return failure(e);}}
