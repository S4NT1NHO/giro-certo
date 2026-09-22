import { createServerClient } from '@supabase/ssr';
import { NextResponse,type NextRequest } from 'next/server';
export async function proxy(request:NextRequest){
 let response=NextResponse.next({request});
 const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
  cookies:{getAll(){return request.cookies.getAll();},setAll(values){for(const {name,value} of values)request.cookies.set(name,value);response=NextResponse.next({request});for(const {name,value,options} of values)response.cookies.set(name,value,options);}}
 });
 await supabase.auth.getClaims();
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 response.headers.set('X-Content-Type-Options','nosniff');
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|favicon.svg).*)']};
