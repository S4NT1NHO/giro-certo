"use client";
import { useState,type FormEvent } from "react";
import { Motorbike, ArrowRight, ShieldCheck, Eye, EyeOff, LoaderCircle, TrendingUp, Fuel, Wallet, Check } from "lucide-react";

export default function LoginForm(){
 const [register,setRegister]=useState(false),[notice,setNotice]=useState(""),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  const data=new FormData(event.currentTarget);setError("");
  if(register&&data.get("password")!==data.get("confirmation")){setError("As senhas precisam ser iguais.");return;}
  setBusy(true);
  try{
   const response=await fetch(`/api/auth/${register?"register":"login"}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:data.get("username"),password:data.get("password"),...(register?{name:data.get("name"),email:data.get("email")}:{})})});
   const result=await response.json() as {error?:string;confirmationRequired?:boolean};
   if(!response.ok)throw new Error(result.error??"Não foi possível concluir. Tente novamente.");
   if(result.confirmationRequired){setNotice("Conta criada! Abra o e-mail de confirmação e depois entre com seu usuário e senha. Confira também o spam.");setBusy(false);setRegister(false);return;}
   location.assign("/");
  }catch(e){setError((e as Error).message);setBusy(false);}
 }
 function changeMode(value:boolean){setRegister(value);setError("");setShow(false);}
 return <main className="login-page">
  <div className="auth-shell">
   <section className="auth-pitch" aria-label="Giro Certo, controle financeiro do motoboy">
    <div className="login-brand"><span className="brand-icon"><Motorbike size={30}/></span><span>giro <b>certo</b><small>CONTROLE FINANCEIRO DO MOTOBOY</small></span></div>
    <span className="pitch-tag"><span/> MAIS CONTROLE EM CADA CORRIDA</span>
    <h1>Seu corre. <br/>Seu dinheiro. <br/><em>Tudo na conta.</em></h1>
    <p className="pitch-description">Saiba quanto entrou, quanto a moto custou e quanto sobrou no seu mês. Seu trabalho merece esse controle.</p>
    <div className="finance-preview" aria-label="Exemplo de resumo financeiro">
     <div className="preview-heading"><span>Seu mês em números</span><small>EXEMPLO</small></div>
     <div className="preview-values"><div><span><TrendingUp size={16}/>Recebido</span><strong>R$ 2.480<span>,00</span></strong></div><div><span><Fuel size={16}/>Gastos</span><strong>R$ 760<span>,00</span></strong></div></div>
     <div className="preview-balance"><div><span>Saldo do mês</span><strong>R$ 1.720,00</strong></div><span className="balance-icon"><Wallet size={24}/></span></div>
    </div>
    <div className="pitch-benefits"><span><Check size={16}/>Serviços e clientes</span><span><Check size={16}/>Combustível e manutenção</span><span><Check size={16}/>Resumo mensal</span></div>
   </section>
   <section className="login-card">
    <div className="auth-tabs" aria-label="Acesso à conta"><button type="button" className={!register?"selected":""} aria-pressed={!register} disabled={busy} onClick={()=>changeMode(false)}>Entrar</button><button type="button" className={register?"selected":""} aria-pressed={register} disabled={busy} onClick={()=>changeMode(true)}>Criar conta</button></div>
    <span className="login-label">{register?"COMECE A ORGANIZAR SEU CORRE":"BOM TE VER POR AQUI"}</span>
    <h2>{register?"Crie sua conta":"Entre no Giro Certo"}</h2>
    <p>{register?"Escolha seu usuário e sua senha para começar.":"Acesse seu controle financeiro e acompanhe os resultados do seu trabalho."}</p>
    {notice&&<p role="status" className="auth-notice">{notice}</p>}
    <form className="login-form" onSubmit={submit}>
     <fieldset disabled={busy} className="user-form">
      {register&&<><div className="field"><label htmlFor="login-name">Seu nome</label><input id="login-name" name="name" required maxLength={120} autoComplete="name" placeholder="Como você se chama?"/></div>{<div className="field"><label htmlFor="login-email">E-mail</label><input id="login-email" name="email" required type="email" maxLength={254} autoComplete="email" placeholder="voce@exemplo.com"/></div>}</>}
      <div className="field"><label htmlFor="login-user">{register?"Nome de usuário":"Usuário ou e-mail"}</label><input id="login-user" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={register?40:254} minLength={register?3:1} pattern={register?"[a-zA-Z0-9._\\-]{3,40}":undefined} placeholder={register?"Ex.: joao.moto":"Digite seu usuário"}/>{register&&<small>De 3 a 40 letras sem acentos, números, ponto, traço ou sublinhado.</small>}</div>
      <div className="field"><label htmlFor="login-password">Senha</label><div className="password-input"><input id="login-password" name="password" type={show?"text":"password"} required minLength={register?10:1} maxLength={128} autoComplete={register?"new-password":"current-password"} placeholder={register?"Pelo menos 10 caracteres":"Digite sua senha"}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Ocultar senha":"Mostrar senha"}>{show?<EyeOff size={20}/>:<Eye size={20}/>}</button></div></div>
      {register&&<div className="field"><label htmlFor="login-confirmation">Confirme a senha</label><input id="login-confirmation" name="confirmation" type="password" required minLength={10} maxLength={128} autoComplete="new-password" placeholder="Digite a senha novamente"/></div>}
     </fieldset>
     {error&&<p role="alert" className="form-error">{error}</p>}
     <button className="primary login-button" disabled={busy}>{busy?<LoaderCircle className="animate-spin" size={19}/>:<ArrowRight size={19}/>} {busy?"Aguarde…":register?"Criar minha conta":"Entrar na minha conta"}</button>
    </form>
    <div className="login-help"><ShieldCheck size={21}/><div><strong>Seus dados, no seu acesso</strong><p>Cada pessoa tem sua própria conta. Seus clientes, serviços e gastos ficam separados.</p></div></div>
    {!register&&<p className="login-contact">Esqueceu a senha? Peça ao responsável pelo app para redefini-la.</p>}
   </section>
  </div>
  <p className="login-footer">Giro Certo · O controle financeiro de quem vive na rua.</p>
 </main>;
}
