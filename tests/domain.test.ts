import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseMoney,summary,serviceSchema,expenseSchema,type Records} from '../lib/domain.ts';
test('Valores brasileiros são armazenados em centavos',()=>{assert.equal(parseMoney('1.234,56'),123456);assert.equal(parseMoney('0,10')+parseMoney('0,20'),30);assert.equal(parseMoney('35'),3500);assert.throws(()=>parseMoney('12.34'));assert.throws(()=>parseMoney('-10,00'));});
test('Resumo inclui somente serviços e gastos do mês selecionado',()=>{
 const common={id:crypto.randomUUID(),client_id:crypto.randomUUID(),category:'Entrega' as const,description:'Teste',has_photo:false};
 const cost={id:crypto.randomUUID(),category:'Combustível' as const,description:''};
 const data:Records={clients:[],services:[{...common,date:'2026-09-22',amount:10000},{...common,date:'2026-08-22',amount:99999}],expenses:[{...cost,date:'2026-09-22',amount:3050},{...cost,date:'2026-08-22',amount:7777}]};
 const result=summary(data,'2026-09');assert.equal(result.income,10000);assert.equal(result.cost,3050);assert.equal(result.balance,6950);assert.equal(summary(data,'2026-10').balance,0);
});
test('Datas inexistentes, categorias desconhecidas e gastos negativos são rejeitados',()=>{
 const service={id:crypto.randomUUID(),client_id:crypto.randomUUID(),date:'2026-02-30',category:'Entrega',description:'Documento',amount:10};assert.equal(serviceSchema.safeParse(service).success,false);assert.equal(serviceSchema.safeParse({...service,date:'2026-02-28'}).success,true);assert.equal(serviceSchema.safeParse({...service,date:'2026-02-28',category:'desconhecida'}).success,false);assert.equal(expenseSchema.safeParse({id:crypto.randomUUID(),date:'2026-09-22',category:'Combustível',description:'',amount:-1}).success,false);
});
