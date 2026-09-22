import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/accounts";
import LoginForm from "./login-form";
export const dynamic="force-dynamic";
export default async function Login(){if(await currentAccount())redirect("/");return <LoginForm/>;}
