import {createHash} from 'node:crypto';
import {adminClient} from '@/lib/supabase/admin';
import {failure,jsonBody,verifyOrigin,RequestError} from '@/lib/server';
import {checkDatabase} from '@/lib/errors';
import {z} from 'zod';
export async function POST(request:Request){try{
 verifyOrigin(request);
 const input=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),receiver:z.string().trim().min(2).max(120).optional(),contact:z.string().trim().max(120).default(''),relationship:z.string().trim().max(120).default(''),note:z.string().trim().max(1000).default(''),accepted:z.boolean().optional()}).parse(await jsonBody(request));
 if(input.receiver&&!input.accepted)throw new RequestError('Marque a confirmação de recebimento.');
 const {data,error}=await adminClient().rpc('giro_receive',{token:createHash('sha256').update(input.token).digest('hex'),receiver:input.receiver??null,contact:input.contact,relationship:input.relationship,note:input.note});checkDatabase(error);
 if(!data)throw new RequestError('Este link expirou, foi substituído ou já foi confirmado. Solicite outro link ao motoboy.',410);
 return Response.json(data,{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}catch(e){return failure(e);}}
