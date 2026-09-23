import type {Delivery} from './delivery';

type Picture = {data:string; width:number; height:number};
type Pictures = {logo?:Picture; photo?:Picture};

async function raster(url:string):Promise<Picture>{
 const response=await fetch(url);
 if(!response.ok)throw new Error('Não foi possível carregar a foto. Tente baixar novamente.');
 const object=URL.createObjectURL(await response.blob());
 try{
  const img=new Image();img.src=object;await img.decode();
  const scale=Math.min(1,1800/Math.max(img.width,img.height));
  const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return {data:canvas.toDataURL('image/jpeg',.88),width:img.width,height:img.height};
 }finally{URL.revokeObjectURL(object);}
}

// Keep the renderer independent of browser loading so the actual PDF can be reviewed.
export async function createDeliveryPDF(data:Delivery,pictures:Pictures={}){
 if(!data.confirmed_at)throw new Error('Aguarde a confirmação do recebimento.');
 const {jsPDF}=await import('jspdf');
 const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
 const ink='#172D29', muted='#62736D', green='#27634D', pale='#F1F5F2', line='#DCE5DF';
 const left=18,right=192,width=174,bottom=261;
 let y=0;
 const clean=(value:string)=>value.replace(/[\u0000-\u0008\u000b-\u001f]/g,'').replace(/[^\u0020-\u00ff\n]/g,' ');
 const font=(size:number,bold=false,color=ink)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(color);};
 const write=(value:string,x:number,baseline:number,size=10,bold=false,color=ink)=>{font(size,bold,color);doc.text(clean(value),x,baseline);};
 const rule=(at:number)=>{doc.setDrawColor(line);doc.setLineWidth(.25);doc.line(left,at,right,at);};
 const fit=(picture:Picture,x:number,top:number,w:number,h:number)=>{
  const scale=Math.min(w/picture.width,h/picture.height);
  const iw=picture.width*scale,ih=picture.height*scale;
  doc.addImage(picture.data,'JPEG',x+(w-iw)/2,top+(h-ih)/2,iw,ih);
 };
 const wrap=(value:string,w:number,size=10,bold=false)=>{font(size,bold);return doc.splitTextToSize(clean(value),w) as string[];};
 const shortId=data.id.slice(0,8).toUpperCase();
 const header=(continued=false)=>{
  doc.setFillColor(green);doc.rect(left,15,12,1.2,'F');
  write('GIRO CERTO',left,23,9,true,green);
  font(8,false,muted);doc.text('REGISTRO DE SERVIÇO',right,23,{align:'right'});
  if(continued){write('Comprovante de recebimento',left,35,16,true);write('CONTINUAÇÃO  /  '+shortId,left,43,8,false,muted);rule(48);y=57;return;}
  write('Comprovante',left,39,26,true);write('de recebimento',left,50,26,true);
  doc.setFillColor(pale);doc.roundedRect(148,32,44,11,2,2,'F');
  write('RECEBIDO',158,39,9,true,green);
  font(8,false,muted);doc.text('Nº '+shortId,right,49,{align:'right'});
  rule(57);y=65;
 };
 const room=(height:number)=>{if(y+height>bottom){doc.addPage();header(true);}};
 const paragraph=(value:string,size=10,color=ink)=>{
  for(const row of wrap(value,width,size)){room(5.2);write(row,left,y,size,false,color);y+=5.2;}y+=3;
 };
 const section=(number:string,title:string)=>{room(19);write(number,left,y,8,true,green);write(title,left+10,y,11,true);y+=4;rule(y);y+=6;};
 const fieldRow=(fields:{label:string;value:string}[])=>{
  const w=(width-8*(fields.length-1))/fields.length;
  const rows=fields.map(f=>wrap(f.value,w,10));
  const count=Math.max(...rows.map(r=>r.length));
  // Long values flow across pages instead of overflowing a cell.
  if(count>12){for(const f of fields){room(13);write(f.label,left,y,7.5,true,muted);y+=6;paragraph(f.value);}return;}
  room(10+count*5);
  fields.forEach((f,i)=>{const x=left+i*(w+8);write(f.label,x,y,7.5,true,muted);rows[i].forEach((r,j)=>write(r,x,y+6+j*5,10));});
  y+=9+count*5;
 };
 header();
 const companyLines=wrap(data.client,pictures.logo?139:width,16,true);
 write('CLIENTE / EMPRESA',left,y,7.5,true,muted);y+=8;
 const companyTop=y-5;
 for(const row of companyLines){room(8);write(row,left,y,16,true);y+=7;}
 if(pictures.logo)fit(pictures.logo,163,companyTop,29,17);
 y=Math.max(y,companyTop+(pictures.logo?20:0))+5;
 fieldRow([{label:'DATA DO SERVIÇO',value:data.date.split('-').reverse().join('/')},{label:'TIPO DE SERVIÇO',value:data.category}]);
 section('01','Serviço realizado');paragraph(data.description);
 section('02','Dados do recebimento');
 fieldRow([{label:'RECEBIDO POR',value:data.receiver_name||'Não informado'},{label:'CONFIRMADO EM · HORÁRIO DE BRASÍLIA',value:new Date(data.confirmed_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}]);
 const optional=[];
 if(data.receiver_contact)optional.push({label:'CONTATO',value:data.receiver_contact});
 if(data.receiver_role)optional.push({label:'VÍNCULO COM O DESTINATÁRIO',value:data.receiver_role});
 if(optional.length)fieldRow(optional);
 if(data.notes){room(14);write('OBSERVAÇÕES DO RECEBIMENTO',left,y,7.5,true,muted);y+=6;paragraph(data.notes,9);}
 // Keep the photo and signature together; typical receipts fit on one A4 page.
 const panelHeight=pictures.photo?78:70;
 room(panelHeight+13);section('03','Registro da entrega');
 const top=y-2,gap=8,panelWidth=pictures.photo?83:width;
 doc.setDrawColor(line);doc.setLineWidth(.3);
 if(pictures.photo){
  doc.roundedRect(left,top,panelWidth,panelHeight,2,2,'S');
  write('FOTO ANEXADA AO SERVIÇO',left+5,top+8,7,true,muted);
  fit(pictures.photo,left+4,top+13,panelWidth-8,panelHeight-18);
 }
 const sx=pictures.photo?left+panelWidth+gap:left;
 doc.setFillColor(pale);doc.roundedRect(sx,top,panelWidth,panelHeight,2,2,'FD');
 write('ASSINATURA DE QUEM RECEBEU',sx+5,top+8,7,true,muted);
 if(data.signature_data){
  const sw=Math.min(panelWidth-12,100),sh=sw/3;
  doc.addImage(data.signature_data,'PNG',sx+(panelWidth-sw)/2,top+17,sw,sh);
  doc.setDrawColor('#B9C9BF');doc.line(sx+6,top+17+sh+3,sx+panelWidth-6,top+17+sh+3);
  const caption=wrap('Assinatura registrada na confirmação do recebimento.',panelWidth-12,8);
  font(8,false,muted);doc.text(caption,sx+6,top+17+sh+9);
 }else{
  const note=wrap('Sem assinatura registrada. Recebimento anterior à disponibilização da assinatura na plataforma.',panelWidth-12,9);
  font(9,false,muted);doc.text(note,sx+6,top+22);
 }
 y=top+panelHeight+8;
 const total=doc.getNumberOfPages();
 for(let page=1;page<=total;page++){
  doc.setPage(page);rule(271);
  write('REGISTRO '+data.id,left,277,7,false,muted);
  write('Dados declarados por quem recebeu. Comprovante de serviço; não é nota fiscal.',left,282,7,false,muted);
  write('Giro Certo · Gestão de serviços e entregas',left,289,7,true,green);
  font(7,false,muted);doc.text(`${String(page).padStart(2,'0')} / ${String(total).padStart(2,'0')}`,right,289,{align:'right'});
 }
 doc.setProperties({title:`Comprovante de recebimento - ${data.client}`,subject:`Registro de serviço ${data.id}`,creator:'Giro Certo'});
 return doc;
}

export async function deliveryPDF(data:Delivery){
 if(!data.confirmed_at)throw new Error('Aguarde a confirmação do recebimento.');
 if(data.photo_unavailable)throw new Error('A foto está temporariamente indisponível. Tente novamente para baixar o comprovante completo.');
 const [logo,photo]=await Promise.all([data.logo?raster(data.logo):undefined,data.photo_url?raster(data.photo_url):undefined]);
 const doc=await createDeliveryPDF(data,{logo,photo});
 const name=data.client.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').slice(0,60);
 doc.save(`Comprovante-${name}-${data.date}.pdf`);
}


