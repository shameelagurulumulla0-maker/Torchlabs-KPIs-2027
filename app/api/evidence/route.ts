import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import {dashboardState} from '../../../db/schema';
import {and,eq} from 'drizzle-orm';
import {canEnterActual,canReadMetric,visibleState} from '../../permissions';
import type {State,EvidenceFile} from '../../model';
import {editableActual,invalidateReview} from '../../reviews';
export const dynamic='force-dynamic';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
async function context(){const user=await getChatGPTUser();if(!user)return null;const db=getDb(),row=await db.select().from(dashboardState).where(eq(dashboardState.id,'organization')).get();if(!row)return null;const state:State=JSON.parse(row.content),member=state.members?.find(m=>m.email.toLowerCase()===user.email.toLowerCase()&&(!m.userId||m.userId===user.userId));return member?{user,db,row,state,member}:null;}
export async function GET(request:Request){
 try{const c=await context();if(!c)return reply({error:'Sign in with an authorized KPI account.'},403);const id=new URL(request.url).searchParams.get('id'),file=c.state.files?.find(f=>f.id===id),metric=c.state.metrics.find(m=>m.id===file?.metricId);
 if(!file||!metric||!canReadMetric(c.member,metric,c.state))return reply({error:'Evidence not found or not available to your role.'},404);
 if(!env.BUCKET)return reply({error:'Evidence storage is not available.'},503);
 const object=await env.BUCKET.get(`evidence/${file.id}`);if(!object)return reply({error:'Evidence file is not available.'},404);
 return new Response(object.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="${file.name.replace(/[^a-zA-Z0-9._ -]/g,'_')}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});
 }catch{return reply({error:'Unable to retrieve this evidence file.'},503);}
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Invalid request origin.'},403);
 try{const c=await context();if(!c)return reply({error:'Sign in with an authorized KPI account.'},403);if(!env.BUCKET)return reply({error:'Evidence storage is not available yet.'},503);
 if(Number(request.headers.get('content-length')||0)>11*1024*1024)return reply({error:'Choose a file smaller than 10 MB.'},400);
 const form=await request.formData(),metricId=String(form.get('metricId')||''),period=String(form.get('period')||''),revision=Number(form.get('revision')),file=form.get('file');
 const metric=c.state.metrics.find(m=>m.id===metricId);if(!metric||!canEnterActual(c.member,metric))return reply({error:'Your role cannot submit evidence for this KPI.'},403);
 if(!/^20\d\d-(MidYear|YearEnd|Annual|Q[1-4]|M(0[1-9]|1[0-2]))$/.test(period)||!file||typeof file==='string'||!file.size||file.size>10*1024*1024||!/(\.(pdf|png|jpe?g|webp|xlsx?|csv|docx?|txt))$/i.test(file.name))return reply({error:'Choose a PDF, image, spreadsheet, Word document or text file, up to 10 MB.'},400);
 if(!editableActual(c.state,c.member,metric,period))return reply({error:'Evidence uploads require an open review window and a draft or returned KPI.'},403);
 if(revision!==c.row.revision)return reply({error:'Another change was saved. Reload the dashboard before uploading.'},409);
 const same=(c.state.files||[]).filter(f=>f.metricId===metricId&&f.period===period);if(same.length>=20)return reply({error:'This KPI period already has 20 evidence files. Add supporting links instead.'},400);
 const at=new Date().toISOString(),meta:EvidenceFile={id:crypto.randomUUID(),metricId,period,name:file.name.slice(0,200),size:file.size,type:file.type||'application/octet-stream',uploadedAt:at,uploadedBy:c.user.displayName};
 await env.BUCKET.put(`evidence/${meta.id}`,await file.arrayBuffer(),{httpMetadata:{contentType:'application/octet-stream'}});
 invalidateReview(c.state,metric,period,c.user.displayName,'Evidence file added; resubmission required');
 c.state.files=[...(c.state.files||[]),meta];c.state.audit.unshift({id:crypto.randomUUID(),at,actor:c.user.displayName,event:'evidence',detail:`Uploaded evidence: ${metric.name} · ${period} · ${meta.name}`,metricId});
 const saved=await c.db.update(dashboardState).set({content:JSON.stringify(c.state),revision:revision+1,updatedAt:at}).where(and(eq(dashboardState.id,'organization'),eq(dashboardState.revision,revision))).returning().get();
 if(!saved){await env.BUCKET.delete(`evidence/${meta.id}`);return reply({error:'Another change was saved. Reload before uploading again.'},409);}
 return reply({state:visibleState(c.state,c.member),revision:revision+1,member:c.member,file:meta});
 }catch{return reply({error:'The evidence file could not be uploaded. Please retry.'},503);}
}
