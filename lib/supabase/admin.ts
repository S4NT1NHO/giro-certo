import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { RequestError } from '@/lib/errors';
export function adminClient(){
 const key=process.env.SUPABASE_SECRET_KEY;
 if(!key)throw new RequestError('O responsável precisa configurar a conexão do servidor com o banco.',503);
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
