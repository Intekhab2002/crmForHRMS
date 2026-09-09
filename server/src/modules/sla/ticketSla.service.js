import AppError from "../../helpers/AppError.js";
import repository from "./sla.repository.js";
import { SLA_STATUS,SLA_ERROR_CODES } from "./sla.constants.js";

async function requireTicket(id,tx=null){
    const ticket=await repository.oneTicket(id,tx);
    if(!ticket)throw AppError.notFound("Ticket not found.",{code:SLA_ERROR_CODES.TICKET_NOT_FOUND});
    return ticket;
}
function snapshot(policy,rule){
    return {policy:{id:policy.id,code:policy.code,name:policy.name,triggerFieldKey:policy.trigger_field_key,triggerValueKey:policy.trigger_value_key,durationFieldKey:policy.duration_field_key,calendarId:policy.calendar_id,calendarCode:policy.calendar_code,timezone:policy.calendar_timezone,businessHoursPerDay:Number(policy.business_hours_per_day),workdayStartTime:policy.workday_start_time,workdayEndTime:policy.workday_end_time,includeSaturday:policy.include_saturday,includeSunday:policy.include_sunday},rule:{id:rule?.id??null,fieldValueKey:rule?.field_value_key??null,resolutionMinutes:rule?.resolution_minutes??null}};
}
async function get(id){
    await requireTicket(id);const sla=await repository.oneTicketSla(id);
    if(!sla)return {ticketId:id,status:SLA_STATUS.NOT_TRACKED,segments:[]};
    return {...sla,segments:await repository.listSegments(sla.id)};
}
async function history(id){await requireTicket(id);const sla=await repository.oneTicketSla(id);return {ticketId:id,status:sla?.status??SLA_STATUS.NOT_TRACKED,segments:sla?await repository.listSegments(sla.id):[]};}
async function setNotTracked(ticket,policy=null,tx=null){
    return repository.upsertTicketSla({ticketId:ticket.id,slaPolicyId:policy?.id??null,status:SLA_STATUS.NOT_TRACKED,elapsedBusinessMinutes:0,remainingBusinessMinutes:null,lastCalculatedAt:new Date(),activationFieldKey:policy?.trigger_field_key??null,activationFieldValueKey:policy?.trigger_value_key??null,durationFieldKey:policy?.duration_field_key??null,durationFieldValueKey:null,policySnapshot:policy?snapshot(policy,null):{}},tx);
}
async function activate(ticket,policy,rule,now,tx=null){
    const existing=await repository.oneTicketSla(ticket.id,tx);
    const runtime=await repository.upsertTicketSla({ticketId:ticket.id,slaPolicyId:policy.id,status:SLA_STATUS.RUNNING,activatedAt:existing?.activated_at??now,pausedAt:null,stoppedAt:null,completedAt:null,breachedAt:null,targetResolutionMinutes:rule.resolution_minutes,elapsedBusinessMinutes:0,remainingBusinessMinutes:rule.resolution_minutes,lastCalculatedAt:now,activationFieldKey:policy.trigger_field_key,activationFieldValueKey:policy.trigger_value_key,durationFieldKey:policy.duration_field_key,durationFieldValueKey:rule.field_value_key,policySnapshot:snapshot(policy,rule)},tx);
    if(!existing||existing.status===SLA_STATUS.NOT_TRACKED)await repository.createSegment({ticketSlaId:runtime.id,startedAt:existing?.activated_at??now,triggerValueKey:policy.trigger_value_key,durationValueKey:rule.field_value_key,targetMinutes:rule.resolution_minutes,status:SLA_STATUS.RUNNING},tx);
    return runtime;
}
async function pause(runtime,now,consumed,tx=null){
    await repository.closeSegment(runtime.id,now,consumed,SLA_STATUS.PAUSED,tx);
    return repository.updateTicketSla(runtime.id,{status:SLA_STATUS.PAUSED,pausedAt:now,elapsedBusinessMinutes:consumed,remainingBusinessMinutes:Math.max(Number(runtime.target_resolution_minutes??0)-consumed,0),lastCalculatedAt:now},tx);
}
async function resume(ticket,policy,rule,now,consumed,tx=null){
    const runtime=await repository.oneTicketSla(ticket.id,tx);
    await repository.createSegment({ticketSlaId:runtime.id,startedAt:now,triggerValueKey:policy.trigger_value_key,durationValueKey:rule.field_value_key,targetMinutes:rule.resolution_minutes,status:SLA_STATUS.RUNNING},tx);
    return repository.updateTicketSla(runtime.id,{status:SLA_STATUS.RUNNING,pausedAt:null,targetResolutionMinutes:rule.resolution_minutes,elapsedBusinessMinutes:consumed,remainingBusinessMinutes:Math.max(rule.resolution_minutes-consumed,0),durationFieldValueKey:rule.field_value_key,lastCalculatedAt:now,policySnapshot:snapshot(policy,rule)},tx);
}
async function terminal(runtime,now,consumed,status,tx=null){
    await repository.closeSegment(runtime.id,now,consumed,status,tx);
    return repository.updateTicketSla(runtime.id,{status,completedAt:status===SLA_STATUS.COMPLETED?now:undefined,stoppedAt:status===SLA_STATUS.STOPPED?now:undefined,breachedAt:status===SLA_STATUS.BREACHED?now:undefined,elapsedBusinessMinutes:consumed,remainingBusinessMinutes:Math.max(Number(runtime.target_resolution_minutes??0)-consumed,0),lastCalculatedAt:now},tx);
}
export default Object.freeze({get,history,setNotTracked,activate,pause,resume,complete:(r,n,c,t)=>terminal(r,n,c,SLA_STATUS.COMPLETED,t),stop:(r,n,c,t)=>terminal(r,n,c,SLA_STATUS.STOPPED,t),breach:(r,n,t)=>terminal(r,n,Number(r.target_resolution_minutes??0),SLA_STATUS.BREACHED,t)});
