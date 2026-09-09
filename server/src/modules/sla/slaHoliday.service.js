import AppError from "../../helpers/AppError.js";
import repository from "./sla.repository.js";
import calendarService from "./slaCalendar.service.js";
import { SLA_ERROR_CODES } from "./sla.constants.js";

async function requireHoliday(id,tx=null){
    const item=await repository.oneHoliday(id,tx);
    if(!item)throw AppError.notFound("SLA holiday not found.",{code:SLA_ERROR_CODES.HOLIDAY_NOT_FOUND});
    return item;
}
async function list(calendarId,o={}){await calendarService.requireCalendar(calendarId);return repository.listHolidays(calendarId,o);}
async function create(calendarId,data){await calendarService.requireCalendar(calendarId);return repository.createHoliday({...data,calendarId,name:data.name.trim()});}
async function update(id,data){await requireHoliday(id);return repository.updateHoliday(id,{...data,name:data.name?.trim()});}
async function remove(id){await requireHoliday(id);return repository.updateHoliday(id,{isActive:false});}
export default Object.freeze({list,create,update,remove,requireHoliday});
