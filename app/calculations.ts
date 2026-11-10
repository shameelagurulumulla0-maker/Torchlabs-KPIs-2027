import type {Metric,CalculationSpec,PerformanceInput,SourcePlan} from './model';
export const sourceProviders=['Manual entry','Jira','ClickUp','Internal dashboard','Database','Custom API'] as const;
export function calculationFor(m:Metric):CalculationSpec{
 if(m.calculation)return m.calculation;
 const variance=/^Budget Variance % = \((.+) − (.+)\) ÷ \2 × 100$/.exec(m.definition.trim());
 if(variance)return {kind:'variance',numeratorLabel:variance[1],denominatorLabel:variance[2],multiplier:100};
 const ratio=/^([^÷]+) ÷ ([^÷]+) × 100$/.exec(m.definition.trim());
 if(ratio)return {kind:'ratio',numeratorLabel:ratio[1],denominatorLabel:ratio[2],multiplier:100};
 return {kind:'value',numeratorLabel:'Reported result',denominatorLabel:'',multiplier:1};
}
export function validCalculation(c:CalculationSpec){return !!c&&['value','ratio','variance','sum','average'].includes(c.kind)&&typeof c.multiplier==='number'&&Number.isFinite(c.multiplier)&&c.multiplier>0&&typeof c.numeratorLabel==='string'&&!!c.numeratorLabel.trim()&&c.numeratorLabel.length<=250&&typeof c.denominatorLabel==='string'&&c.denominatorLabel.length<=250&&(!['ratio','variance'].includes(c.kind)||!!c.denominatorLabel.trim());}
export function validSourcePlan(p:SourcePlan){return !!p&&sourceProviders.includes(p.provider)&&['reference','numeratorField','denominatorField','valueField','notes'].every(k=>typeof p[k as keyof SourcePlan]==='string'&&p[k as keyof SourcePlan].length<=1000);}
export function calculate(c:CalculationSpec,input:PerformanceInput|undefined):{value:number|null;error?:string}{
 if(!validCalculation(c))return {value:null,error:'The calculation rule needs Admin review.'};if(!input)return {value:null};if(typeof input!=='object'||Array.isArray(input))return {value:null,error:'Enter valid performance input fields.'};
 for(const n of [input.numerator,input.denominator])if(n!==undefined&&n!==null&&(typeof n!=='number'||!Number.isFinite(n)))return {value:null,error:'Enter finite numerical inputs.'};
 if(input.values!==undefined&&(!Array.isArray(input.values)||input.values.length>1000||input.values.some(v=>typeof v!=='number'||!Number.isFinite(v))))return {value:null,error:'Enter up to 1,000 valid numbers.'};
 let value:number|null=null;
 if(c.kind==='sum'||c.kind==='average'){if(!input.values?.length)return {value:null};const sum=input.values.reduce((a,v)=>a+v,0);value=(c.kind==='average'?sum/input.values.length:sum)*c.multiplier;}
 else if(c.kind==='value'){value=input.numerator==null?null:input.numerator*c.multiplier;}
 else{if(input.numerator==null||input.denominator==null)return {value:null};if(input.denominator<=0)return {value:null,error:'The denominator must be greater than zero; blank or zero totals are not treated as achievement.'};value=(c.kind==='variance'?(input.numerator-input.denominator):input.numerator)/input.denominator*c.multiplier;}
 return value!==null&&!Number.isFinite(value)?{value:null,error:'The calculated result is outside the supported range.'}:{value};
}
export function calculationText(c:CalculationSpec){return c.kind==='ratio'?`${c.numeratorLabel} ÷ ${c.denominatorLabel} × ${c.multiplier}`:c.kind==='variance'?`(${c.numeratorLabel} − ${c.denominatorLabel}) ÷ ${c.denominatorLabel} × ${c.multiplier}`:c.kind==='sum'?`Sum of entered values × ${c.multiplier}`:c.kind==='average'?`Average of entered values × ${c.multiplier}`:`${c.numeratorLabel} × ${c.multiplier}`;}
