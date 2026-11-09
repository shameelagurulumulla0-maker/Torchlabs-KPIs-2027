import Workspace from "./workspace";
import {requireChatGPTUser} from "./chatgpt-auth";
export const dynamic="force-dynamic";
export default async function Page(){const user=await requireChatGPTUser("/");return <Workspace user={user.displayName}/>;}
