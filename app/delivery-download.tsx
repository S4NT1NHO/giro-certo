"use client";
import {useState} from 'react';
import {deliveryPDF} from '@/lib/delivery-pdf';
import type {Delivery} from '@/lib/delivery';
export default function DeliveryDownload({load}:{load:()=>Promise<Delivery>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function download(){setBusy(true);setError('');try{await deliveryPDF(await load());}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="delivery-download"><button className="primary" disabled={busy} onClick={()=>void download()}>{busy?'Preparando comprovante…':'Baixar comprovante PDF'}</button>{error&&<p className="form-error" role="alert">{error}</p>}</div>;
}
