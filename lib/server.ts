import { RequestError } from "@/lib/errors";
export { RequestError } from "@/lib/errors";
import { requireAccount } from "@/lib/accounts";
import { ZodError } from "zod";
export async function boundedBody(request:Request,limit:number){
 if(Number(request.headers.get("content-length"))>limit)throw new RequestError("O arquivo ou formulário ultrapassou o tamanho permitido.",413);
 if(!request.body)return new Uint8Array();
 const reader=request.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new RequestError("O arquivo ou formulário ultrapassou o tamanho permitido.",413);}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
export async function jsonBody(request:Request){try{return JSON.parse(new TextDecoder().decode(await boundedBody(request,32*1024)));}catch(error){if(error instanceof RequestError)throw error;throw new RequestError("Formulário inválido. Confira os campos e tente novamente.");}}
export function verifyOrigin(request:Request){if(request.method!=="GET"){const origin=request.headers.get("origin");if(request.headers.get("sec-fetch-site")==="cross-site"||(origin&&origin!==new URL(request.url).origin))throw new RequestError("Origem da solicitação inválida.",403);}}
export async function owner(request?:Request){if(request)verifyOrigin(request);const user=await requireAccount();return user.id;}
export function failure(error:unknown){if(error instanceof RequestError)return Response.json({error:error.message},{status:error.status});if(error instanceof ZodError)return Response.json({error:error.issues[0]?.message??"Confira os campos informados."},{status:400});console.error("Record request failed",error);return Response.json({error:"Não foi possível concluir. Seus dados do formulário foram mantidos. Tente novamente."},{status:503});}
