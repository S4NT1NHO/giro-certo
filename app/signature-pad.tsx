"use client";
import {useRef,type PointerEvent} from 'react';
export default function SignaturePad({onChange}:{onChange:(value:string)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),drawing=useRef(false),points=useRef(0);
 function point(e:PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect();return [(e.clientX-r.left)*900/r.width,(e.clientY-r.top)*300/r.height];}
 function start(e:PointerEvent<HTMLCanvasElement>){if(e.button!==0)return;e.preventDefault();drawing.current=true;e.currentTarget.setPointerCapture(e.pointerId);const c=e.currentTarget.getContext('2d')!;const [x,y]=point(e);c.beginPath();c.moveTo(x,y);c.lineWidth=3;c.strokeStyle='#172b22';c.lineCap='round';c.lineJoin='round';}
 function move(e:PointerEvent<HTMLCanvasElement>){if(!drawing.current)return;const [x,y]=point(e);const c=e.currentTarget.getContext('2d')!;c.lineTo(x,y);c.stroke();points.current++;}
 function end(){drawing.current=false;if(points.current>=5)onChange(canvas.current!.toDataURL('image/png'));}
 return <div className="signature-field"><span>Assinatura de quem recebeu *</span><p id="signature-help">Assine no espaço abaixo com o dedo ou mouse.</p><canvas ref={canvas} width={900} height={300} aria-label="Área para desenhar assinatura" aria-describedby="signature-help" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/><button type="button" className="secondary" onClick={()=>{canvas.current!.getContext('2d')!.clearRect(0,0,900,300);points.current=0;onChange('');}}>Limpar assinatura</button></div>;
}
