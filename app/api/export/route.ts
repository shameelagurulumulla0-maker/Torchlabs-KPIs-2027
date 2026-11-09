import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import {dashboardState} from '../../../db/schema';
import {eq} from 'drizzle-orm';
import type {State} from '../../model';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to export.'},{status:401});
 const row=await getDb().select().from(dashboardState).where(eq(dashboardState.id,'organization')).get();if(!row)return Response.json({error:'No saved KPI data.'},{status:404});
 const state:State=JSON.parse(row.content),member=state.members?.find(m=>m.email.toLowerCase()===user.email.toLowerCase()&&(!m.userId||m.userId===user.userId)),admin=member?.role==='General Admin'||member?.role==='CEO';
 if(!member||!admin&&member.role!=='Functional Leader')return Response.json({error:'Only Admin, CEO and assigned department supervisors can export.'},{status:403});
 const p=new URL(request.url).searchParams,period=p.get('period')||'',department=p.get('department')||'All',person=p.get('person')||'All',layer=p.get('layer')||'all';
 if(p.get('format')==='json'){if(!admin)return Response.json({error:'Overall backups are restricted to Admin and CEO.'},{status:403});return new Response(JSON.stringify(state,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="Torchlabs-overall-backup.json"','Cache-Control':'no-store'}});}
 if(!/^20\d\d-(MidYear|YearEnd|Annual|Q[1-4]|M(0[1-9]|1[0-2]))$/.test(period))return Response.json({error:'Select a valid reporting period.'},{status:400});
 if(!admin&&(department!=='All'&&!member.departments.includes(department)||layer==='organizational'))return Response.json({error:'Supervisors can export only their assigned departments.'},{status:403});
 const metrics=state.metrics.filter(m=>(admin||m.layer!=='organizational'&&member.departments.includes(m.department||''))&&(department==='All'||m.department===department)&&(person==='All'||m.employeeId===person)&&(layer==='all'||m.layer===layer));
 const q=(v:unknown)=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const records=[['Period','Layer','Department','Employee','KPI','Goals','Weight','Target','Upper target','Actual','Review status'],...metrics.map(m=>{const e=state.entries[m.id+':'+period];return [period,m.layer,m.department,m.owner,m.name,(m.orgGoals||[m.goal]).join(', '),m.weight,e?.target,e?.upper,e?.actual,state.reviews?.[m.id+':'+period]?.status||'Draft'];})];
 return new Response(records.map(r=>r.map(q).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv;charset=utf-8','Content-Disposition':`attachment; filename="Torchlabs-${period}.csv"`,'Cache-Control':'no-store'}});
}
