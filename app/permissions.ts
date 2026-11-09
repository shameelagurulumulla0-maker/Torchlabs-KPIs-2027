import type {Member,Metric,State} from './model';
export const roles=['Individual Employee','Functional Leader','CEO','General Admin'] as const;
export function canReadMetric(member:Member,m:Metric){
 if(member.role==='General Admin'||member.role==='CEO')return true;
 if(member.employeeId&&m.employeeId===member.employeeId)return true;
 if(m.layer==='organizational')return true;
 if(member.role==='Functional Leader')return member.departments.includes(m.department||'');
 return m.employeeId===member.employeeId||m.layer==='departmental'&&member.departments.includes(m.department||'');
}
export function canSetTarget(member:Member,_m:Metric){return member.role==='General Admin'||member.role==='CEO';}
export function canEnterActual(member:Member,m:Metric){return member.role==='General Admin'||member.role==='CEO'&&m.layer==='organizational'||member.role==='Functional Leader'&&m.layer==='departmental'&&member.departments.includes(m.department||'')||!!member.employeeId&&m.employeeId===member.employeeId;}
export function canEditMetric(member:Member,m:Metric){return canSetTarget(member,m);}
export function visibleState(state:State,member:Member):State{
 const metrics=state.metrics.filter(m=>canReadMetric(member,m)),ids=new Set(metrics.map(m=>m.id));
 const privileged=member.role==='General Admin'||member.role==='CEO';
 return {...state,metrics,riskFlags:(state.riskFlags||[]).filter(f=>ids.has(f.metricId)),levelConfigs:Object.fromEntries(Object.entries(state.levelConfigs||{}).filter(([key])=>metrics.some(m=>key.startsWith(m.id+':'))||(state.employees||[]).some(e=>key.startsWith('scorecard:'+e.id+':')&&metrics.some(m=>m.employeeId===e.id)))),entries:Object.fromEntries(Object.entries(state.entries).filter(([key])=>ids.has(key.split(':')[0]))),revenueContributions:Object.fromEntries(Object.entries(state.revenueContributions||{}).filter(([,record])=>ids.has(record.metricId))),files:(state.files||[]).filter(f=>ids.has(f.metricId)),actions:state.actions.filter(a=>ids.has(a.metricId)),audit:privileged?state.audit:state.audit.filter(a=>a.metricId&&ids.has(a.metricId)),employees:(state.employees||[]).filter(e=>privileged||metrics.some(m=>m.employeeId===e.id)||e.id===member.employeeId),members:member.role==='General Admin'?state.members:[member]};
}
