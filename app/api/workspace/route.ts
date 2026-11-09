import {getChatGPTUser,type ChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import {dashboardState} from '../../../db/schema';
import {and,eq} from 'drizzle-orm';
import {initialState,validEntry,emptyEntry,type State,type Metric,type Entry,type Action,type Member} from '../../model';
import {upgradeState,departments} from '../../frameworks';
import {canSetTarget,canEnterActual,canOverrideActual,canEditMetric,visibleState,roles} from '../../permissions';
import {validLevels,flagRecipients,canReviewFlag} from '../../performance';
import type {LevelConfig,RiskFlag} from '../../model';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const validPeriod=(p:unknown)=>typeof p==='string'&&/^20\d\d-(Annual|Q[1-4]|M(0[1-9]|1[0-2]))$/.test(p);
async function read(user:ChatGPTUser){
 const db=getDb();let found=await db.select().from(dashboardState).where(eq(dashboardState.id,'organization')).get();
 const result=upgradeState(found?JSON.parse(found.content):initialState(),user);
 if(result.changed){
 const row={id:'organization',content:JSON.stringify(result.state),revision:(found?.revision??0)+1,updatedAt:new Date().toISOString()};
 const saved=found?await db.update(dashboardState).set(row).where(and(eq(dashboardState.id,'organization'),eq(dashboardState.revision,found.revision))).returning().get():await db.insert(dashboardState).values(row).onConflictDoNothing().returning().get();
 found=saved||await db.select().from(dashboardState).where(eq(dashboardState.id,'organization')).get();
 }
 if(!found)throw Error('Database initialization failed');
 const state:State=JSON.parse(found.content);const member=state.members?.find(m=>m.email.toLowerCase()===user.email.toLowerCase()&&(!m.userId||m.userId===user.userId));
 return {state,revision:found.revision,member,db};
}
export async function GET(){
 const user=await getChatGPTUser();if(!user)return reply({error:'Please sign in to use your dashboard.'},401);
 try{const {state,revision,member}=await read(user);if(!member)return reply({error:'Your account is awaiting access. Ask the General Admin to assign your role and employee profile.'},403);return reply({state:visibleState(state,member),revision,member});}
 catch{return reply({error:'Saved data is unavailable. Please retry.'},503);}
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'Please sign in to save changes.'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Invalid request origin.'},403);
 try{
 const text=await request.text();if(text.length>50000)return reply({error:'This update is too large.'},400);
 const body=JSON.parse(text),{state,revision,member,db}=await read(user);
 if(!member)return reply({error:'Your account has no assigned KPI role.'},403);
 if(body.revision!==revision)return reply({error:'Another change was saved. Reload the dashboard before saving again.'},409);
 const at=new Date().toISOString();let detail='',metricId:string|undefined;
 if(body.type==='entry'){
 const m=state.metrics.find(m=>m.id===body.metricId),e=body.entry as Entry;
 if(!m||!validPeriod(body.period)||!e||!validEntry(e,m))return reply({error:'Check the target range, numeric values and evidence URL.'},400);
 const old=state.entries[`${m.id}:${body.period}`]||emptyEntry;
 if(!canSetTarget(member,m)&&(old.target!==e.target||old.upper!==e.upper))return reply({error:'Your role cannot change targets for this KPI.'},403);
 const supervisorCorrection=canOverrideActual(member,m,state);
 if(!canEnterActual(member,m)&&!supervisorCorrection&&old.actual!==e.actual)return reply({error:'Your role cannot enter actual results for this KPI.'},403);
 if(!canEnterActual(member,m)&&(old.evidence!==e.evidence||(old.evidenceNotes||'')!==(e.evidenceNotes||'')||JSON.stringify(old.evidenceLinks||[])!==JSON.stringify(e.evidenceLinks||[])))return reply({error:'Only the assigned employee or accountable role can update achievement evidence.'},403);
 if(supervisorCorrection){
 if(old.actual===null||e.actual===null)return reply({error:'A supervisor may correct an existing employee actual; it cannot be blank.'},400);
 if(old.notes!==e.notes)return reply({error:'A supervisor correction cannot change the employee’s review notes.'},403);
 if(e.actual!==old.actual){if(typeof body.justification!=='string'||!body.justification.trim()||body.justification.length>2000)return reply({error:'A justification is mandatory when a supervisor changes an employee actual.'},400);state.actualAdjustments=[{id:crypto.randomUUID(),metricId:m.id,period:body.period,before:old.actual,after:e.actual,justification:body.justification.trim(),at,actorId:member.id,actor:user.displayName},...(state.actualAdjustments||[])];}
 }
 if(!canSetTarget(member,m)&&!canEnterActual(member,m)&&!supervisorCorrection)return reply({error:'You do not have permission to update this KPI.'},403);
 if(body.revenueContribution!==undefined){
 if(m.department!=='Sales'||!m.employeeId||!canEnterActual(member,m))return reply({error:'Only the accountable Sales employee or General Admin can enter sales revenue contribution.'},403);
 const amount=body.revenueContribution;if(amount!==null&&(typeof amount!=='number'||!Number.isFinite(amount)||amount<0))return reply({error:'Sales revenue contribution must be a non-negative USD amount or blank.'},400);
 state.revenueContributions={...(state.revenueContributions||{}),[`${m.employeeId}:${body.period}`]:{employeeId:m.employeeId,period:body.period,amount,metricId:m.id,updatedAt:at}};
 }
 state.entries[`${m.id}:${body.period}`]={target:e.target,upper:e.upper,actual:e.actual,notes:e.notes,evidence:e.evidence,evidenceNotes:e.evidenceNotes||'',evidenceLinks:e.evidenceLinks||[],updatedAt:at};metricId=m.id;detail=`${m.name} · ${body.period}: target ${e.target??'blank'}, actual ${e.actual??'blank'}`;
 }else if(body.type==='metric'){
 const incoming=body.metric as Metric;const old=state.metrics.find(m=>m.id===incoming?.id);
 if(!old)return reply({error:'Select an existing KPI to edit.'},400);
 if(!canEditMetric(member,old))return reply({error:'Your role cannot configure this KPI.'},403);
 if(typeof incoming.name!=='string'||!incoming.name.trim()||incoming.name.length>150||typeof incoming.unit!=='string'||!incoming.unit||incoming.unit.length>30||!['higher','lower','range'].includes(incoming.direction)||typeof incoming.owner!=='string'||incoming.owner.length>100||typeof incoming.definition!=='string'||incoming.definition.length>4000)return reply({error:'Please complete the KPI definition.'},400);
 if(incoming.organizationalKpiIds!==undefined&&(!Array.isArray(incoming.organizationalKpiIds)||incoming.organizationalKpiIds.some(id=>typeof id!=='string'||!state.metrics.some(m=>m.id===id&&m.layer==='organizational'&&(old.orgGoals||[old.goal]).includes(m.goal)))))return reply({error:'Select valid organizational KPI links.'},400);
 if(incoming.briefDescription!==undefined&&(typeof incoming.briefDescription!=='string'||incoming.briefDescription.length>180)||incoming.expectedOutcome!==undefined&&(typeof incoming.expectedOutcome!=='string'||incoming.expectedOutcome.length>220))return reply({error:'Keep the description and expected outcome brief.'},400);
 Object.assign(old,{organizationalKpiIds:incoming.organizationalKpiIds===undefined?old.organizationalKpiIds:[...new Set(incoming.organizationalKpiIds)],name:incoming.name,unit:incoming.unit,direction:incoming.direction,owner:incoming.owner,definition:incoming.definition,briefDescription:incoming.briefDescription||'',expectedOutcome:incoming.expectedOutcome||''});metricId=old.id;detail=`Updated KPI definition: ${old.name}`;
 }else if(body.type==='levels'){
 const id=String(body.metricId||''),m=state.metrics.find(m=>m.id===id),employee=id.startsWith('scorecard:')?state.employees?.find(e=>e.id===id.slice(10)):null;
 if(!m&&!employee||!validPeriod(body.period))return reply({error:'Select a valid KPI or employee scorecard and period.'},400);
 if(member.role!=='General Admin'&&member.role!=='CEO')return reply({error:'Only General Admin and CEO can set L1–L5 thresholds.'},403);
 const config=body.config as LevelConfig;if(!validLevels(config)||employee&&config.basis!=='achievement')return reply({error:'Use valid, non-overlapping L1–L5 ranges. Lower limits are inclusive; upper limits are exclusive.'},400);
 state.levelConfigs={...(state.levelConfigs||{}),[`${id}:${body.period}`]:{basis:config.basis,bands:config.bands.map(b=>({level:b.level,min:b.min,max:b.max})),updatedAt:at,updatedBy:user.displayName}};metricId=m?.id;detail=`Updated L1–L5 thresholds: ${m?.name||employee?.name} · ${body.period}`;
 }else if(body.type==='risk_flag'){
 const incoming=body.flag as RiskFlag,previous=state.riskFlags?.find(f=>f.id===incoming?.id),m=state.metrics.find(m=>m.id===(previous?.metricId||incoming?.metricId));
 if(!m||!m.employeeId||!incoming)return reply({error:'Select an employee KPI to flag.'},400);
 const reviewing=!!previous&&canReviewFlag(member,previous)&&body.review===true;
 if(body.review===true&&!reviewing)return reply({error:'Only the assigned manager, CEO or General Admin can acknowledge this warning.'},403);
 if(reviewing){
 if(!['Open','Acknowledged','Resolved'].includes(incoming.status)||typeof incoming.managerNote!=='string'||incoming.managerNote.length>2000)return reply({error:'Select a review status and keep the manager note concise.'},400);
 Object.assign(previous!,{status:incoming.status,managerNote:incoming.managerNote,updatedAt:at});detail=`Manager ${incoming.status.toLowerCase()} early warning: ${m.name}`;
 }else{
 if(!canEnterActual(member,m)||previous&&previous.raisedById!==member.id&&member.role!=='General Admin')return reply({error:'You can only raise or edit a warning for your own assigned KPI.'},403);
 if(!validPeriod(incoming.period)||typeof incoming.reason!=='string'||!incoming.reason.trim()||incoming.reason.length>2000||typeof incoming.helpNeeded!=='string'||incoming.helpNeeded.length>2000||!['At risk','Unlikely to achieve'].includes(incoming.severity)||incoming.forecastActual!==null&&(typeof incoming.forecastActual!=='number'||!Number.isFinite(incoming.forecastActual)))return reply({error:'Explain the risk and select the correct reporting period.'},400);
 const routed=flagRecipients(state,m.employeeId,m,member.id),flag:RiskFlag={id:previous?.id||crypto.randomUUID(),metricId:m.id,employeeId:m.employeeId,period:incoming.period,reason:incoming.reason.trim(),helpNeeded:incoming.helpNeeded,forecastActual:incoming.forecastActual,severity:incoming.severity,status:previous?.status||'Open',raisedById:previous?.raisedById||member.id,raisedBy:previous?.raisedBy||user.displayName,raisedAt:previous?.raisedAt||at,updatedAt:at,...routed,managerNote:previous?.managerNote||''};
 if(previous)state.riskFlags![state.riskFlags!.indexOf(previous)]=flag;else state.riskFlags=[flag,...(state.riskFlags||[])];detail=`Early warning raised: ${m.name} · ${incoming.period} · ${incoming.severity}`;
 }metricId=m.id;
 }else if(body.type==='action'){
 const a=body.action as Action,m=state.metrics.find(m=>m.id===a?.metricId),previous=state.actions.find(x=>x.id===a?.id);
 if(!m||!canSetTarget(member,m)&&!canEnterActual(member,m))return reply({error:'Your role cannot create actions for this KPI.'},403);
 if(previous){const pm=state.metrics.find(m=>m.id===previous.metricId)!;if(!canSetTarget(member,pm)&&!canEnterActual(member,pm))return reply({error:'Your role cannot edit this action.'},403);}
 if(typeof a.title!=='string'||!a.title.trim()||a.title.length>250||typeof a.owner!=='string'||!a.owner.trim()||a.owner.length>100||!['Open','In progress','Done'].includes(a.status)||!/^\d{4}-\d{2}-\d{2}$/.test(a.due)||!validPeriod(a.period))return reply({error:'Complete the action, owner, date and reporting period.'},400);
 const clean={id:previous?.id||crypto.randomUUID(),metricId:m.id,period:a.period,title:a.title,owner:a.owner,due:a.due,status:a.status,createdAt:previous?.createdAt||at};
 if(previous)state.actions[state.actions.indexOf(previous)]=clean;else state.actions.push(clean);metricId=m.id;detail=`${a.title} · ${a.status} · due ${a.due}`;
 }else if(body.type==='member'){
 if(member.role!=='General Admin')return reply({error:'Only the General Admin can manage access.'},403);
 const m=body.member as Member;if(!m||typeof m.email!=='string'||!/^\S+@\S+\.\S+$/.test(m.email)||m.email.length>200||typeof m.name!=='string'||!m.name.trim()||m.name.length>100||!roles.includes(m.role)||!Array.isArray(m.departments)||m.departments.some(d=>!departments.includes(d)))return reply({error:'Complete the name, email, role and departments.'},400);
 if(m.employeeId&&!state.employees?.some(e=>e.id===m.employeeId))return reply({error:'Select a valid employee scorecard.'},400);
 if(m.employeeId&&state.members!.some(x=>x.id!==m.id&&x.employeeId===m.employeeId))return reply({error:'This employee scorecard is already assigned to another account.'},400);
 if(m.role==='Individual Employee'&&!m.employeeId||m.role==='Functional Leader'&&!m.departments.length)return reply({error:'Employees need a scorecard. Functional Leaders need at least one department.'},400);
 const old=state.members!.find(x=>x.id===m.id);if(state.members!.some(x=>x.id!==m.id&&x.email.toLowerCase()===m.email.toLowerCase()))return reply({error:'This email already has a role.'},400);
 if(old?.role==='General Admin'&&m.role!=='General Admin'&&state.members!.filter(x=>x.role==='General Admin').length===1)return reply({error:'Keep at least one General Admin.'},400);
 if(old?.id===member.id&&(m.email.toLowerCase()!==member.email.toLowerCase()||m.role!=='General Admin'))return reply({error:'Keep your current administrator access. Assign another administrator first.'},400);
 const dep=m.role==='Individual Employee'?[...new Set(state.metrics.filter(metric=>metric.employeeId===m.employeeId).map(metric=>metric.department!).filter(Boolean))]:m.departments;
 const clean:Member={id:old?.id||crypto.randomUUID(),email:m.email.toLowerCase(),name:m.name.trim(),role:m.role,departments:dep,employeeId:m.employeeId||'',...(old?.userId&&old.email.toLowerCase()===m.email.toLowerCase()?{userId:old.userId}:{})};
 if(old)state.members![state.members!.indexOf(old)]=clean;else state.members!.push(clean);detail=`Assigned ${clean.role}: ${clean.name}`;
 }else if(body.type==='employee'){
 if(member.role!=='General Admin')return reply({error:'Only the General Admin can manage employee profiles.'},403);
 const employee=state.employees?.find(e=>e.id===body.employeeId);if(!employee||typeof body.name!=='string'||!body.name.trim()||body.name.length>100)return reply({error:'Enter an employee name.'},400);
 if(body.managerId!==undefined){const manager=state.members?.find(m=>m.id===body.managerId);if(body.managerId&&(!manager||manager.role==='Individual Employee'||manager.role==='Functional Leader'&&!state.metrics.some(m=>m.employeeId===employee.id&&manager.departments.includes(m.department||''))))return reply({error:'Choose an administrator, CEO or a Functional Leader with access to this employee’s functions.'},400);employee.managerId=String(body.managerId);}
 employee.name=body.name.trim();state.metrics.filter(m=>m.employeeId===employee.id).forEach(m=>m.owner=employee.name);for(const flag of state.riskFlags||[])if(flag.employeeId===employee.id&&flag.status!=='Resolved'){const m=state.metrics.find(m=>m.id===flag.metricId);if(m)Object.assign(flag,flagRecipients(state,employee.id,m,flag.raisedById));}detail=`Updated employee profile: ${employee.name}`;
 }else return reply({error:'Unsupported update.'},400);
 if(body.type==='entry'&&typeof body.justification==='string'&&body.justification.trim())detail+=` · supervisor justification: ${body.justification.trim()}`;
 if(body.type==='entry'&&body.revenueContribution!==undefined)detail+=` · attributed recognized revenue USD ${body.revenueContribution??'not reported'}`;
 state.audit.unshift({id:crypto.randomUUID(),at,actor:user.displayName,event:body.type,detail,metricId});
 const row={content:JSON.stringify(state),revision:revision+1,updatedAt:at};
 const saved=await db.update(dashboardState).set(row).where(and(eq(dashboardState.id,'organization'),eq(dashboardState.revision,revision))).returning().get();
 if(!saved)return reply({error:'Another change was saved. Reload before trying again.'},409);
 const updatedMember=state.members!.find(m=>m.id===member.id)!;return reply({state:visibleState(state,updatedMember),revision:revision+1,member:updatedMember});
 }catch{return reply({error:'The change could not be saved. Please check the fields and retry.'},503);}
}
