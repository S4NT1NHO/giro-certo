import {createHash} from 'node:crypto';
import {adminClient} from '@/lib/supabase/admin';
import {failure,boundedBody,verifyOrigin,RequestError} from '@/lib/server';
import {deliveryPhoto} from '@/lib/delivery-server';
import {checkDatabase} from '@/lib/errors';
import {z} from 'zod';
export async function POST(request:Request){try{
 verifyOrigin(request);
 let body;try{body=JSON.parse(new TextDecoder().decode(await boundedBody(request,160000)));}catch(e){if(e instanceof RequestError)throw e;throw new RequestError('Formulário inválido.');}
 const input=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),receiver:z.string().trim().min(2).max(120).optional(),contact:z.string().trim().max(120).default(''),relationship:z.string().trim().max(120).default(''),note:z.string().trim().max(1000).default(''),accepted:z.boolean().optional(),signature:z.string().max(140000).regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/).optional()}).parse(body);
 if(input.receiver&&!input.accepted)throw new RequestError('Marque a confirmação de recebimento.');
 if(input.receiver){const png=Buffer.from((input.signature??'').split(',')[1]??'','base64');if(png.length<24||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||png.readUInt32BE(16)!==900||png.readUInt32BE(20)!==300)throw new RequestError('Faça sua assinatura no campo indicado.');}
 const {data,error}=await adminClient().rpc('giro_delivery',{vtoken:createHash('sha256').update(input.token).digest('hex'),receiver:input.receiver??null,contact:input.contact,relationship:input.relationship,note:input.note,signature:input.signature??null});checkDatabase(error);
 if(!data)throw new RequestError('Este link expirou ou foi substituído. Peça o comprovante ao motoboy.',410);
 return Response.json(await deliveryPhoto(data),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}catch(e){return failure(e);}}
