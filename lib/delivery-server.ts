import 'server-only';
import {adminClient} from '@/lib/supabase/admin';
export async function deliveryPhoto(data:Record<string,unknown>){
 const {photo_key,...safe}=data;
 if(typeof photo_key!=='string'||!photo_key)return {...safe,photo_url:null};
 const {data:photo,error}=await adminClient().storage.from('service-photos').createSignedUrl(photo_key,600);
 return {...safe,photo_url:error?null:photo?.signedUrl??null,photo_unavailable:!!error};
}
