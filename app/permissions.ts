import {contribution} from './contribution';
import type {Member,Metric,State} from './model';
export const roles=['Individual Employee','Functional Leader','CEO','General Admin'] as const;
export function canReadMetric(member:Member,m:Metric,state?:State){
 if(member.role==='General Admin'||member.role==='CEO')return true;
 if(member.employeeId&&m.employeeId===member.employeeId)return true;
 if(m.layer==='organizational')return false;
 if(member.role==='Functional Leader')return member.departments.includes(m.department||'');
 return !!member.employeeId&&(m.employeeId===member.employeeId||m.layer==='departmental'&&m.department===(state?.employees?.find(e=>e.id===member.employeeId)?.department||member.departments[0]));
}
export function canSetTarget(member:Member,_m:Metric){return member.role==='General Admin'||member.role==='CEO';}
export function canEnterActual(member:Member,m:Metric){return member.role==='General Admin'||member.role==='CEO'||!!member.employeeId&&m.employeeId===member.employeeId;}
export function canOverrideActual(member:Member,m:Metric,state:State){const employee=state.employees?.find(e=>e.id===m.employeeId);return member.role==='Functional Leader'&&!!m.employeeId&&m.employeeId!==member.employeeId&&member.departments.includes(m.department||'')&&!!employee&&(!employee.managerId||employee.managerId===member.id);}

export function canEditMetric(member:Member,m:Metric){return canSetTarget(member,m);}
export function visibleState(state:State,member:Member):State{
 const metrics=state.metrics.filter(m=>canReadMetric(member,m,state)),ids=new Set(metrics.map(m=>m.id));
 const privileged=member.role==='General Admin'||member.role==='CEO';
 const employeeView=member.role==='Individual Employee',profile=state.employees?.find(e=>e.id===member.employeeId),allowedDepartments=privileged?[...new Set(state.metrics.filter(m=>m.employeeId).map(m=>m.department!))]:member.role==='Functional Leader'?member.departments:profile?[profile.department]:[];
 const periods=new Set([...Object.keys(state.entries).map(k=>k.slice(k.indexOf(':')+1)),...Array.from({length:4},(_,i)=>2027+i).flatMap(y=>['MidYear','YearEnd','Annual','Q1','Q2','Q3','Q4',...Array.from({length:12},(_,i)=>'M'+String(i+1).padStart(2,'0'))].map(p=>y+'-'+p))]);
 const departmentAchievements=[],teamAchievements=[],departmentGoalAchievements=[];
 const directLinks=new Set(state.metrics.filter(m=>m.employeeId===member.employeeId&&!!member.employeeId||member.role==='Functional Leader'&&!!m.employeeId&&member.departments.includes(m.department||'')).flatMap(m=>m.organizationalKpiIds||[]));
 const orgMetrics=state.metrics.filter(m=>m.layer==='organizational'&&(privileged||directLinks.has(m.id))),orgIds=new Set(orgMetrics.map(m=>m.id));
 const organizationOverview={metrics:orgMetrics.map(({id,name,goal,unit,direction})=>({id,name,goal,unit,direction})),entries:Object.fromEntries(Object.entries(state.entries).filter(([key])=>orgIds.has(key.split(':')[0])).map(([key,{target,upper,actual}])=>[key,{target,upper,actual}]))};
 for(const department of allowedDepartments){
  const ms=state.metrics.filter(m=>m.department===department&&m.employeeId&&typeof m.weight==='number');
  for(const period of periods){const total=contribution(ms,state.entries,period),own=contribution(ms.filter(m=>m.employeeId===member.employeeId),state.entries,period);
  const ownContributionPct=own.assessed&&total.possible?own.earned/total.possible*100:null,ownEarnedSharePct=own.assessed&&total.earned?own.earned/total.earned*100:null;
  departmentAchievements.push({department,period,...total,ownContributionPct,ownEarnedSharePct});
  for(const goal of ['G1','G2','G3','G4','G5','G6']){const linked=ms.filter(m=>(m.orgGoals||[m.goal]).includes(goal)),score=contribution(linked,state.entries,period),personal=contribution(linked.filter(m=>m.employeeId===member.employeeId),state.entries,period);departmentGoalAchievements.push({department,period,goal,...score,ownContributionPct:personal.assessed&&score.possible?personal.earned/score.possible*100:null});}
   if(employeeView)for(const employeeId of new Set(ms.map(m=>m.employeeId!))){const e=state.employees?.find(e=>e.id===employeeId);if(!e)continue;teamAchievements.push({department,period,employeeId,name:e.name,designation:e.designation,...contribution(ms.filter(m=>m.employeeId===employeeId),state.entries,period)});}
  }
 }
 return {...state,reviews:Object.fromEntries(Object.entries(state.reviews||{}).filter(([,r])=>ids.has(r.metricId))),actualAdjustments:(state.actualAdjustments||[]).filter(a=>ids.has(a.metricId)),organizationOverview,departmentGoalAchievements,departmentAchievements,teamAchievements:employeeView?teamAchievements:undefined,metrics,riskFlags:(state.riskFlags||[]).filter(f=>ids.has(f.metricId)),levelConfigs:Object.fromEntries(Object.entries(state.levelConfigs||{}).filter(([key])=>metrics.some(m=>key.startsWith(m.id+':'))||(state.employees||[]).some(e=>key.startsWith('scorecard:'+e.id+':')&&metrics.some(m=>m.employeeId===e.id)))),entries:Object.fromEntries(Object.entries(state.entries).filter(([key])=>ids.has(key.split(':')[0]))),revenueContributions:Object.fromEntries(Object.entries(state.revenueContributions||{}).filter(([,record])=>ids.has(record.metricId))),files:(state.files||[]).filter(f=>ids.has(f.metricId)),actions:state.actions.filter(a=>ids.has(a.metricId)),audit:privileged?state.audit:state.audit.filter(a=>a.metricId&&ids.has(a.metricId)),employees:(state.employees||[]).filter(e=>privileged||metrics.some(m=>m.employeeId===e.id)||e.id===member.employeeId),members:privileged?state.members:[member]};
}
