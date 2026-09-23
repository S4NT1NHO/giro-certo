"use client";
import {useState} from 'react';
export default function ClientLogo({id,logo,onSaved}:{id:string;logo?:string|null;onSaved:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(file?:File){setBusy(true);setError('');try{const f=new FormData();f.set('id',id);if(file)f.set('logo',file);else f.set('remove','true');const r=await fetch('/api/client-logo',{method:'POST',body:f});const d=await r.json();if(!r.ok)throw new Error(d.error);onSaved();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="client-logo-upload">{logo&&<img src={logo} alt="Logo da empresa" style={{maxWidth:140,maxHeight:70,objectFit:'contain'}}/>}<label>Logo da empresa<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void save(file);e.target.value='';}}/></label><small>Peça ao cliente a logo da empresa. PNG, JPG ou WebP até 200 KB. Ela aparecerá no demonstrativo e na confirmação.</small>{logo&&<button className="text-button" disabled={busy} onClick={()=>void save()}>Remover logo</button>}{busy&&<p>Salvando logo…</p>}{error&&<p role="alert">{error}</p>}</div>;
}
