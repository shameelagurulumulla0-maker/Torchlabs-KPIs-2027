import type {Member} from './model';
export function accessCategory(member:Member):'Employee'|'Supervisor'|'Admin'{return member.role==='CEO'||member.role==='General Admin'?'Admin':member.role==='Functional Leader'?'Supervisor':'Employee';}
