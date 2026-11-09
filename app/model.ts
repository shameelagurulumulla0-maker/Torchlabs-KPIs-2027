export const goals=[
 {id:'G1',name:'Profitable Commercial Growth',short:'Commercial growth',color:'#bf623e'},
 {id:'G2',name:'Market Expansion & Portfolio Commercialization',short:'Market expansion',color:'#59716a'},
 {id:'G3',name:'Product Quality, Reliability & Supplier Resilience',short:'Quality & resilience',color:'#6b77a3'},
 {id:'G4',name:'Customer Experience & Retention',short:'Customer experience',color:'#a47942'},
 {id:'G5',name:'Operational Maturity & Scalable Execution',short:'Operational maturity',color:'#677f99'},
 {id:'G6',name:'High Performance & Accountability',short:'People & accountability',color:'#9b738a'},
];
export type Layer='organizational'|'departmental'|'supervisory'|'individual';
export type Role='Individual Employee'|'Functional Leader'|'CEO'|'General Admin';
export type Member={id:string;email:string;name:string;role:Role;departments:string[];employeeId:string;userId?:string};
export type Employee={id:string;name:string;designation:string;department:string;supervisory:boolean;managerId?:string};
export type Metric={id:string;goal:string;name:string;unit:string;direction:'higher'|'lower'|'range';definition:string;owner:string;layer?:Layer;department?:string;employeeId?:string;designation?:string;functionalGoalId?:string;weight?:number;kpiType?:string;orgGoals?:string[];briefDescription?:string;expectedOutcome?:string};
export type LevelBand={level:'L1'|'L2'|'L3'|'L4'|'L5';min:number|null;max:number|null};
export type LevelConfig={basis:'actual'|'achievement';bands:LevelBand[];updatedAt?:string;updatedBy?:string};
export type RiskFlag={id:string;metricId:string;employeeId:string;period:string;reason:string;helpNeeded:string;forecastActual:number|null;severity:'At risk'|'Unlikely to achieve';status:'Open'|'Acknowledged'|'Resolved';raisedById:string;raisedBy:string;raisedAt:string;updatedAt:string;recipientIds:string[];recipientNames:string[];managerNote:string};
export type Entry={target:number|null;upper:number|null;actual:number|null;notes:string;evidence:string;evidenceNotes?:string;evidenceLinks?:string[];updatedAt?:string};
export type EvidenceFile={id:string;metricId:string;period:string;name:string;size:number;type:string;uploadedAt:string;uploadedBy:string};
export type RevenueContribution={employeeId:string;period:string;amount:number|null;metricId:string;updatedAt:string};
export type Action={id:string;metricId:string;period:string;title:string;owner:string;due:string;status:'Open'|'In progress'|'Done';createdAt:string};
export type Audit={id:string;at:string;actor:string;event:string;detail:string;metricId?:string};
export type State={metrics:Metric[];entries:Record<string,Entry>;actions:Action[];audit:Audit[];members?:Member[];employees?:Employee[];schemaVersion?:number;files?:EvidenceFile[];revenueContributions?:Record<string,RevenueContribution>;levelConfigs?:Record<string,LevelConfig>;riskFlags?:RiskFlag[]};
const rows:[string,string,string,Metric['direction'],string][]=[
 ['G1','Revenue','USD','higher','Recognized revenue for the selected period.'],
 ['G1','Gross margin','%','higher','Gross profit ÷ recognized revenue × 100.'],
 ['G1','Qualified pipeline coverage','×','higher','Qualified pipeline value ÷ remaining revenue target, using an agreed valuation basis.'],
 ['G1','Sales forecast variance','%','range','(Actual revenue − forecast revenue) ÷ forecast revenue × 100. Enter approved lower and upper tolerance.'],
 ['G1','Qualified opportunity win rate','%','higher','Won qualified opportunities ÷ concluded qualified opportunities × 100.'],
 ['G2','USA / Europe revenue','USD','higher','Recognized revenue from the defined USA / Europe markets.'],
 ['G2','USA / Europe active customers','customers','higher','Active paying customers in defined USA / Europe markets.'],
 ['G2','Residential revenue','USD','higher','Revenue attributable to Residential products.'],
 ['G2','ISP revenue','USD','higher','Revenue attributable to ISP products.'],
 ['G2','Mobile revenue','USD','higher','Revenue attributable to Mobile products.'],
 ['G2','New / materially enhanced offerings','offerings','higher','Offerings meeting agreed launch and readiness criteria.'],
 ['G2','New offering commercial traction','USD','higher','Revenue attributable to eligible new offerings. Define the qualifying portfolio in the notes.'],
 ['G3','Service availability','%','higher','Available service time ÷ eligible scheduled service time × 100.'],
 ['G3','Critical reliability incidents','incidents','lower','Critical incidents meeting the approved severity definition.'],
 ['G3','Customer-impacting incidents','incidents','lower','Incidents with verified customer impact in the selected period.'],
 ['G3','Mean time to restore service','hours','lower','Total restoration time ÷ eligible restored incidents.'],
 ['G3','Supplier concentration','%','lower','Supply attributable to the largest supplier ÷ total eligible supply × 100. Confirm the supply basis before evaluation.'],
 ['G3','Qualified supplier alternatives','suppliers','higher','Alternative suppliers meeting agreed qualification criteria.'],
 ['G3','Supplier SLA compliance','%','higher','Eligible supplier cases meeting SLA ÷ eligible cases assessed × 100.'],
 ['G4','Customer satisfaction (CSAT)','%','higher','Satisfied valid responses ÷ valid responses received × 100.'],
 ['G4','Customer retention','%','higher','Eligible opening customers retained ÷ opening eligible customers × 100.'],
 ['G4','Customer churn','%','lower','Eligible opening customers lost ÷ opening eligible customers × 100.'],
 ['G4','Onboarding / support standard compliance','%','higher','Eligible cases meeting all defined standards ÷ eligible cases assessed × 100.'],
 ['G4','At-risk customer recovery','%','higher','Eligible assigned at-risk customers retained/recovered ÷ eligible assigned customers × 100.'],
 ['G5','Critical process ownership coverage','%','higher','Critical processes with confirmed accountable owners ÷ required critical processes × 100.'],
 ['G5','Planning and status reporting compliance','%','higher','Required plans/reports meeting defined standards and deadlines ÷ required items due × 100.'],
 ['G5','Milestone completion','%','higher','Eligible accepted milestones completed on time ÷ eligible milestones due × 100.'],
 ['G5','Automation / efficiency benefit achievement','%','higher','Approved improvement initiatives meeting predefined benefit criteria ÷ initiatives due for assessment × 100.'],
 ['G5','Operating review completion','%','higher','Required operating reviews completed to standard ÷ reviews due × 100.'],
 ['G5','Management action completion','%','higher','Eligible management actions completed by due date ÷ actions due × 100.'],
 ['G6','Performance review completion','%','higher','Eligible performance reviews completed ÷ reviews due × 100.'],
 ['G6','Employee performance achievement','%','higher','Eligible employees meeting approved performance criteria ÷ eligible employees assessed × 100.'],
 ['G6','Competency / development plan coverage','%','higher','Eligible employees with approved competency/development plans ÷ eligible employees × 100.'],
 ['G6','Voluntary attrition','%','lower','Voluntary departures ÷ average eligible headcount × 100, on a consistent period basis.'],
 ['G6','Regrettable attrition','%','lower','Regrettable departures ÷ average eligible headcount × 100, using an approved classification.'],
 ['G6','Average time to fill','days','lower','Total calendar days to fill eligible roles ÷ filled eligible roles.'],
 ['G6','Probation success','%','higher','Eligible employees successfully completing probation ÷ eligible completed probations × 100.'],
 ['G6','Employee engagement','%','higher','Engagement score converted to the agreed percentage scale.'],
 ['G6','Hybrid-work compliance','%','higher','Applicable working periods meeting hybrid-work requirements ÷ applicable periods × 100.'],
 ['G6','Policy / conduct exceptions','exceptions','lower','Substantiated exceptions meeting agreed policy/conduct definitions.'],
];
export function initialState():State {return {metrics:rows.map((r,i)=>({id:`ORG-${String(i+1).padStart(3,'0')}`,goal:r[0],name:r[1],unit:r[2],direction:r[3],definition:r[4],owner:''})),entries:{},actions:[],audit:[]};}
export const emptyEntry:Entry={target:null,upper:null,actual:null,notes:'',evidence:''};
export function evaluate(m:Metric,e:Entry|undefined){
 if(!e||e.target===null||(m.direction==='range'&&e.upper===null))return {status:'Needs target',met:null,achievement:null};
 if(e.actual===null)return {status:'Needs actual',met:null,achievement:null};
 const met=m.direction==='higher'?e.actual>=e.target:m.direction==='lower'?e.actual<=e.target:e.actual>=e.target&&e.actual<=e.upper!;
 const achievement=m.direction==='higher'&&e.target>0?e.actual/e.target*100:m.direction==='lower'&&e.target>0&&e.actual>0?e.target/e.actual*100:null;
 return {status:met?'Met':'Needs attention',met,achievement};
}
export function periodLabel(period:string){return period.replace('-Annual',' · Annual').replace('-Q',' · Q').replace('-M',' · Month ');}
export function validEntry(e:Entry,m:Metric){
 if([e.target,e.upper,e.actual].some(v=>v!==null&&(typeof v!=='number'||!Number.isFinite(v))))return false;
 if(typeof e.notes!=='string'||e.notes.length>4000||typeof e.evidence!=='string'||e.evidence.length>1000)return false;
 if(e.evidence&&!/^https?:\/\//i.test(e.evidence))return false;
 if(e.evidenceNotes!==undefined&&(typeof e.evidenceNotes!=='string'||e.evidenceNotes.length>4000))return false;
 if(e.evidenceLinks!==undefined&&(!Array.isArray(e.evidenceLinks)||e.evidenceLinks.length>10||e.evidenceLinks.some(url=>typeof url!=='string'||url.length>1000||!/^https?:\/\//i.test(url))))return false;
 return !(m.direction==='range'&&e.target!==null&&e.upper!==null&&e.upper<e.target);
}
