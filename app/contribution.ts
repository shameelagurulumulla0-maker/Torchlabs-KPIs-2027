import {evaluate,type Entry,type Metric,type State} from './model';
export type Contribution={possible:number;assessed:number;earned:number;earnedPct:number|null;coveragePct:number;measuredGapPct:number;pendingPct:number;evaluatedIndex:number|null;count:number;assessedCount:number};
export function attainment(m:Metric,e:Entry|undefined):number|null{
 const result=evaluate(m,e);if(result.met===null)return null;
 if(m.direction==='range'||e!.target!<=0)return result.met?100:0;
 if(m.direction==='lower'&&e!.actual!<=0)return result.met?100:0;
 const ratio=m.direction==='higher'?e!.actual!/e!.target!:e!.target!/e!.actual!;
 return Math.max(0,Math.min(100,ratio*100));
}
export function scorecardMetrics(state:State){return state.metrics.filter(m=>(m.layer==='supervisory'||m.layer==='individual')&&typeof m.weight==='number'&&m.weight>0);}
export function contribution(metrics:Metric[],entries:State['entries'],period:string):Contribution{
 let possible=0,assessed=0,earned=0,assessedCount=0;
 for(const m of metrics){const w=m.weight||0;possible+=w;const a=attainment(m,entries[`${m.id}:${period}`]);if(a!==null){assessed+=w;earned+=w*a/100;assessedCount++;}}
 const coveragePct=possible?assessed/possible*100:0;
 return {possible,assessed,earned,earnedPct:assessed?earned/possible*100:null,coveragePct,measuredGapPct:possible?(assessed-earned)/possible*100:0,pendingPct:possible?(possible-assessed)/possible*100:0,evaluatedIndex:assessed?earned/assessed*100:null,count:metrics.length,assessedCount};
}
export function departmentContributions(state:State,period:string){const ms=scorecardMetrics(state);return [...new Set(ms.map(m=>m.department||'Unassigned'))].map(department=>({department,...contribution(ms.filter(m=>m.department===department),state.entries,period)}));}
export function goalContributions(state:State,period:string){const ms=scorecardMetrics(state);return ['G1','G2','G3','G4','G5','G6'].map(goal=>({goal,...contribution(ms.filter(m=>(m.orgGoals||[m.goal]).includes(goal)),state.entries,period)}));}
export function employeeContributions(state:State,period:string,department='All'){const ms=scorecardMetrics(state).filter(m=>department==='All'||m.department===department);return (state.employees||[]).map(employee=>({employee,...contribution(ms.filter(m=>m.employeeId===employee.id),state.entries,period)})).filter(x=>x.count>0);}
export function contributionExplanation(metric:Metric,entry:Entry|undefined){const a=attainment(metric,entry);if(a===null)return 'Enter an approved target and an actual result to interpret this KPI’s contribution.';if(metric.weight===undefined)return `Target attainment is ${a.toFixed(1)}%. This measure is shown separately from employee-weighted contribution to avoid counting the same performance twice.`;return `This result achieves ${a.toFixed(1)}% of target and earns ${(a*metric.weight).toFixed(1)} of ${(metric.weight*100).toFixed(0)} available scorecard points. It supports ${metric.department} and ${(metric.orgGoals||[metric.goal]).join(', ')}. Organizational outcomes are measured separately.`;}
export function salesRevenue(state:State,period:string){
 const employees=(state.employees||[]).filter(e=>e.department==='Sales');
 const rows=employees.map(employee=>({employee,record:state.revenueContributions?.[`${employee.id}:${period}`]}));
 const reported=rows.filter(r=>r.record?.amount!==null&&r.record?.amount!==undefined),total=reported.reduce((sum,r)=>sum+r.record!.amount!,0);
 const company=state.entries[`ORG-001:${period}`],target=company?.target??null,actual=company?.actual??null;
 return {rows,reported:reported.length,expected:employees.length,total:reported.length?total:null,target,actual,targetProgress:reported.length&&target!==null&&target>0?total/target*100:null,actualShare:reported.length&&actual!==null&&actual>0?total/actual*100:null,overallocated:reported.length&&actual!==null&&total>actual};
}
