import raw from './framework-data.json';
import type {Employee,Metric,State,Member} from './model';
export const departments=['Operations','Project Management','HR','Customer Support','GTM','Analytics','Sales','Engineering','UI/UX','Web Development'];
const specs=[['OPS','Operations Manager','Operations',true,1],['HRP','Manager – Projects & HR','Project Management',true,1],['SUPL','Support Functional Lead','Customer Support',true,1],['L1SUP','L1 Support Agent','Customer Support',false,2],['SGTM','Senior GTM & Analytics','GTM',false,1],['GTM','GTM & Analytics','GTM',false,1],['SDE','Sales Development Executive','Sales',false,2],['SSE','Senior Software Engineer','Engineering',true,1],['SEE','Software Engineer L1 – External','Engineering',false,1],['SEI','Software Engineer L1 – Internal','Engineering',false,1],['UX','UI/UX Designer','UI/UX',false,1],['WEB','Web Developer','Web Development',false,1],['BA','Business Analyst','Analytics',false,1]] as const;
export const seededEmployees:Employee[]=specs.flatMap(([code,designation,department,supervisory,count])=>Array.from({length:count},(_,i)=>({id:`EMP-${code}-${i+1}`,name:`${designation}${count>1?` ${i+1}`:''}`,designation,department,supervisory})));
const byKpi=new Map(raw.functionalGoals.flatMap(g=>g.kpiIds.map(id=>[id,g] as const)));
export function seedMetrics():Metric[]{
 const departmental:Metric[]=raw.functionalGoals.map(g=>({id:g.id,goal:g.orgGoals[0],orgGoals:g.orgGoals,name:g.name,unit:'%',direction:'higher',definition:g.definition+' Grouped functional objective derived from agreed KPIs; target and measurement basis require review.',owner:'',layer:'departmental',department:g.department,functionalGoalId:g.id}));
 const scorecards=seededEmployees.flatMap(e=>{const code=e.id.split('-')[1];return raw.kpis.filter(k=>k.code===code).map(k=>({id:`${e.id}_${k.id}`,goal:k.goals.split(',')[0].trim(),orgGoals:k.goals.split(',').map(g=>g.trim()),name:k.name,unit:'%',direction:k.direction==='Lower is better'?'lower':k.direction==='Range control'?'range':'higher',definition:k.formula,owner:e.name,layer:e.supervisory?'supervisory':'individual',department:k.kind==="Common HR"?e.department:byKpi.get(k.id)?.department||e.department,employeeId:e.id,designation:e.designation,functionalGoalId:byKpi.get(k.id)?.id,weight:k.weight,kpiType:k.kind} as Metric));});
 return [...departmental,...scorecards];
}
export function upgradeState(s:State,owner:{userId:string;email:string;displayName:string}):{state:State;changed:boolean}{
 if(s.schemaVersion===2)return {state:s,changed:false};
 const metrics=s.metrics.map(m=>({...m,layer:m.layer||'organizational',department:m.department||'Organization'} as Metric));
 const ids=new Set(metrics.map(m=>m.id));metrics.push(...seedMetrics().filter(m=>!ids.has(m.id)));
 const members:Member[]=s.members?.length?s.members:[{id:crypto.randomUUID(),email:owner.email.toLowerCase(),name:owner.displayName,role:'General Admin',departments:[...departments],employeeId:'',userId:owner.userId}];
 return {state:{...s,metrics,members,employees:s.employees||seededEmployees,schemaVersion:2},changed:true};
}
