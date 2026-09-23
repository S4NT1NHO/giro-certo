import { z } from "zod";
export const serviceCategories = ["Cartório", "Banco", "Entrega", "Outro"] as const;
export const expenseCategories = ["Combustível", "Peças", "Manutenção", "Outros"] as const;
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+"T12:00:00Z");return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;},"Data inválida");
const id = z.string().uuid();
const amount = z.number().int().min(0).max(999999999);
export const clientSchema = z.object({id,name:z.string().trim().min(1,"Informe o nome do cliente").max(120),phone:z.string().trim().max(30),address:z.string().trim().max(300),notes:z.string().trim().max(2000)});
export const serviceSchema = z.object({id,client_id:id,date,category:z.enum(serviceCategories),description:z.string().trim().min(1,"Descreva o serviço").max(2000),amount});
export const expenseSchema = z.object({id,date,category:z.enum(expenseCategories),description:z.string().trim().max(2000),amount:amount.min(1,"Informe um valor maior que zero")});
export type Client = z.infer<typeof clientSchema> & {logo_data?:string|null};
export type Receipt={service_id:string;expires_at:string;confirmed_at:string|null;receiver_name:string|null;receiver_contact:string|null;receiver_role:string|null;notes:string|null};
export type Service = z.infer<typeof serviceSchema> & {has_photo:boolean;receipt?:Receipt};
export type Expense = z.infer<typeof expenseSchema>;
export type Records = {clients:Client[];services:Service[];expenses:Expense[]};
export const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
export function parseMoney(raw:string){const value=raw.trim();if(!value)return 0;if(!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(value))throw new Error("Use um valor como 35,50, sem o símbolo R$.");const parts=value.replaceAll(".","").split(",");const cents=Number(parts[0])*100+Number((parts[1]??"").padEnd(2,"0"));if(!Number.isSafeInteger(cents)||cents>999999999)throw new Error("O valor informado é muito alto.");return cents;}
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
export function summary(data:Records,month:string){const services=data.services.filter(s=>s.date.startsWith(month+"-"));const expenses=data.expenses.filter(e=>e.date.startsWith(month+"-"));const income=services.reduce((a,s)=>a+s.amount,0),cost=expenses.reduce((a,e)=>a+e.amount,0);return {services,expenses,income,cost,balance:income-cost};}
