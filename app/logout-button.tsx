"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
export default function LogoutButton(){const[busy,setBusy]=useState(false);return <button className="logout" aria-label="Sair da conta" title="Sair da conta" disabled={busy} onClick={async()=>{setBusy(true);try{const response=await fetch("/api/auth/logout",{method:"POST"});if(!response.ok)throw new Error();location.assign("/login");}catch{toast.error("Não foi possível sair. Tente novamente.");setBusy(false);}}}><LogOut size={18}/></button>;}
