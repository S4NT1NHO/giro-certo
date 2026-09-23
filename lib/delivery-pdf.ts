import type {Delivery} from './delivery';
async function raster(url:string){
 const response=await fetch(url);if(!response.ok)throw new Error('Não foi possível carregar a foto. Tente baixar novamente.');
 const blob=await response.blob();const object=URL.createObjectURL(blob);
 try{const img=new Image();img.src=object;await img.decode();const scale=Math.min(1,1800/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return {data:canvas.toDataURL('image/jpeg',.88),width:img.width,height:img.height};}finally{URL.revokeObjectURL(object);}
}
export async function deliveryPDF(data:Delivery){
 if(!data.confirmed_at)throw new Error('Aguarde a confirmação do recebimento.');
 if(data.photo_unavailable)throw new Error('A foto está temporariamente indisponível. Tente novamente para baixar o comprovante completo.');
 const {jsPDF}=await import('jspdf');const doc=new jsPDF();let y=24;
 const clean=(value:string)=>value.replace(/[\u0000-\u0008\u000b-\u001f]/g,'').replace(/[^\u0020-\u00ff\n]/g,' ');
 const space=(height:number)=>{if(y+height>273){doc.addPage();y=24;}};
 const text=(value:string,size=11,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);const lines=doc.splitTextToSize(clean(value),174) as string[];for(const line of lines){space(7);doc.text(line,18,y);y+=size>15?9:6;}y+=3;};
 doc.setTextColor(33,58,46);
 if(data.logo){const logo=await raster(data.logo);const w=Math.min(40,18*logo.width/logo.height);doc.addImage(logo.data,'JPEG',18,y,w,18);y+=26;}
 text(data.client,20,true);text('COMPROVANTE DE ENTREGA / SERVIÇO',12,true);
 doc.setTextColor(55,65,60);text('Registro: '+data.id,9);
 text('Data do serviço: '+data.date.split('-').reverse().join('/')+'  |  '+data.category);
 text('Serviço realizado',12,true);text(data.description);
 text('Recebimento confirmado',12,true);text('Recebido por: '+(data.receiver_name??''));
 text('Confirmado em: '+new Date(data.confirmed_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+' (Brasília)');
 if(data.receiver_contact)text('Contato: '+data.receiver_contact);
 if(data.receiver_role)text('Vínculo: '+data.receiver_role);
 if(data.notes){text('Observações',11,true);text(data.notes);}
 space(66);text('Assinatura de quem recebeu',11,true);
 if(data.signature_data){doc.addImage(data.signature_data,'PNG',18,y,150,50);y+=55;}else text('Este recebimento foi registrado antes da inclusão da assinatura desenhada.');
 if(data.photo_url){const photo=await raster(data.photo_url);const h=Math.min(180,174*photo.height/photo.width),w=Math.min(174,h*photo.width/photo.height);space(h+20);text('Foto anexada ao serviço',12,true);doc.addImage(photo.data,'JPEG',18,y,w,h);y+=h+8;}
 text('Confirmação com dados e assinatura declarados por quem recebeu. Documento de registro do serviço; não é nota fiscal.',8);
 const total=doc.getNumberOfPages();for(let p=1;p<=total;p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor(100);doc.text('Giro Certo  |  Comprovante de recebimento',18,286);doc.text(`${p} / ${total}`,190,286,{align:'right'});}
 const name=data.client.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').slice(0,60);
 doc.save(`Comprovante-${name}-${data.date}.pdf`);
}
