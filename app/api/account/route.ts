import { requireAccount } from "@/lib/accounts";
import { failure } from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(){try{const account=await requireAccount();return Response.json({username:account.username,name:account.name,email:account.email,role:account.role},{headers:{"Cache-Control":"no-store"}});}catch(e){return failure(e)}}
