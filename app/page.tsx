import Dashboard from "./dashboard";
import { currentAccount } from "@/lib/accounts";
import { redirect } from "next/navigation";
export const dynamic="force-dynamic";
export default async function Home(){
 let account=null;
 try{account=await currentAccount();}catch{}
 if(!account)redirect("/login");
 return <Dashboard account={{name:account.name,email:account.email,role:account.role}}/>;
}
