import repository from "./sla.repository.js";
import policyService from "./slaPolicy.service.js";
import { SLA_FIELD_REGISTRY } from "./sla.constants.js";

export function getTicketFieldValue(ticket,key){
    if(!SLA_FIELD_REGISTRY[key])return null;
    return ticket[`${key}_code`]??null;
}
export async function resolve(ticket,at=new Date(),tx=null){
    const matches=[];
    for(const key of Object.keys(SLA_FIELD_REGISTRY)){
        const value=getTicketFieldValue(ticket,key);
        if(!value)continue;
        const policy=await policyService.resolve(key,value,at,tx);
        if(policy)matches.push(policy);
    }
    matches.sort((a,b)=>Number(b.priority)-Number(a.priority)||new Date(b.effective_from)-new Date(a.effective_from));
    return matches[0]??null;
}
export async function resolveRule(policy,ticket,tx=null){
    const value=getTicketFieldValue(ticket,policy.duration_field_key);
    return {valueKey:value,rule:value?await repository.findRule(policy.id,value,tx):null};
}
export default Object.freeze({resolve,resolveRule,getTicketFieldValue});
