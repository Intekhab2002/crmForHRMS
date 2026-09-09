import AppError from "../../helpers/AppError.js";
import repository from "./sla.repository.js";
import { SLA_ERROR_CODES } from "./sla.constants.js";

function assertTimezone(value){
    try{new Intl.DateTimeFormat("en-US",{timeZone:value}).format();}catch{
        throw AppError.validation("Invalid IANA timezone.");
    }
}
function validateWindow(start,end,hours){
    const [sh,sm]=start.split(":").map(Number),[eh,em]=end.split(":").map(Number);
    const available=(eh*60+em-sh*60-sm)/60;
    if(available<=0)throw AppError.validation("Workday end time must be later than start time.");
    if(Number(hours)>available)throw AppError.validation("Business hours per day cannot exceed the configured workday window.");
}
async function requireCalendar(id,tx=null){
    const item=await repository.oneCalendar(id,tx);
    if(!item)throw AppError.notFound("SLA calendar not found.",{code:SLA_ERROR_CODES.CALENDAR_NOT_FOUND});
    return item;
}
async function list(o={}){return repository.listCalendars(o);}
async function getById(id){return requireCalendar(id);}
async function create(d,tx=null){
    assertTimezone(d.timezone);validateWindow(d.workdayStartTime,d.workdayEndTime,d.businessHoursPerDay);
    return repository.createCalendar(d,tx);
}
async function update(id,d,tx=null){
    const current=await requireCalendar(id,tx),merged={...current,...d};
    assertTimezone(merged.timezone);validateWindow(String(merged.workday_start_time??merged.workdayStartTime).slice(0,5),String(merged.workday_end_time??merged.workdayEndTime).slice(0,5),merged.business_hours_per_day??merged.businessHoursPerDay);
    return repository.updateCalendar(id,d,tx);
}
async function setActive(id,active,tx=null){await requireCalendar(id,tx);return repository.setCalendarActive(id,active,tx);}
export default Object.freeze({list,getById,requireCalendar,create,update,setActive});
