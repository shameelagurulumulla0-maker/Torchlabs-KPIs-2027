import Dashboard from "./dashboard";
import {requireChatGPTUser} from "./chatgpt-auth";
export const dynamic="force-dynamic";
export default async function Page(){const user=await requireChatGPTUser("/");return <Dashboard user={user.displayName}/>;}
