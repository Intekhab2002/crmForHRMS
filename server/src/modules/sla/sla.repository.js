import { getQueryExecutor } from "../../database/queryExecutor.js";

const POLICY_SELECT = `
SELECT p.*, c.code AS calendar_code, c.name AS calendar_name,
 c.timezone AS calendar_timezone, c.business_hours_per_day,
 c.workday_start_time, c.workday_end_time,
 c.include_saturday, c.include_sunday
FROM sla_policies p
JOIN sla_calendars c ON c.id = p.calendar_id
`;

const CALENDAR_SELECT = `
SELECT id, code, name, timezone, business_hours_per_day,
 workday_start_time, workday_end_time, include_saturday,
 include_sunday, is_active, created_at, updated_at
FROM sla_calendars
`;

const TICKET_SELECT = `
SELECT t.*,
 dc.code AS dependency_category_code,
 dc.name AS dependency_category_name,
 sv.code AS severity_code,
 sv.name AS severity_name,
 st.code AS status_code,
 st.name AS status_name
FROM tickets t
LEFT JOIN ticket_dependency_categories dc ON dc.id=t.dependency_category_id
LEFT JOIN ticket_severities sv ON sv.id=t.severity_id
LEFT JOIN ticket_statuses st ON st.id=t.status_id
`;

const SLA_SELECT = `
SELECT ts.*, p.code AS policy_code, p.name AS policy_name,
 c.code AS calendar_code, c.name AS calendar_name,
 c.timezone AS calendar_timezone, c.business_hours_per_day,
 c.workday_start_time, c.workday_end_time,
 c.include_saturday, c.include_sunday
FROM ticket_sla ts
LEFT JOIN sla_policies p ON p.id=ts.sla_policy_id
LEFT JOIN sla_calendars c ON c.id=p.calendar_id
`;

const ex=(tx)=>getQueryExecutor(tx);

async function onePolicy(id,tx=null){
 const r=await ex(tx).query(`${POLICY_SELECT} WHERE p.id=$1 LIMIT 1`,[id]);
 return r.rows[0]??null;
}
async function listPolicies({page=1,limit=20,search=null,isActive=null}={},tx=null){
 const where=[],params=[]; let i=1;
 if(search){where.push(`(p.code ILIKE $${i} OR p.name ILIKE $${i})`);params.push(`%${search}%`);i++;}
 if(typeof isActive==="boolean"){where.push(`p.is_active=$${i}`);params.push(isActive);i++;}
 const clause=where.length?`WHERE ${where.join(" AND ")}`:"";
 const count=await ex(tx).query(`SELECT COUNT(*)::bigint total FROM sla_policies p ${clause}`,params);
 params.push(limit,(page-1)*limit);
 const rows=await ex(tx).query(`${POLICY_SELECT} ${clause} ORDER BY p.priority DESC,p.effective_from DESC,p.name LIMIT $${i} OFFSET $${i+1}`,params);
 return {rows:rows.rows,total:Number(count.rows[0]?.total??0)};
}
async function applicablePolicy(field,value,at,tx=null){
 const r=await ex(tx).query(`${POLICY_SELECT}
 WHERE p.is_active=TRUE AND c.is_active=TRUE
 AND p.trigger_field_key=$1 AND p.trigger_value_key=$2
 AND p.effective_from<= $3
 AND (p.effective_to IS NULL OR p.effective_to>$3)
 ORDER BY p.priority DESC,p.effective_from DESC,p.created_at DESC LIMIT 1`,[field,value,at]);
 return r.rows[0]??null;
}
async function createPolicy(d,tx=null){
 const r=await ex(tx).query(`INSERT INTO sla_policies
 (code,name,description,is_active,trigger_field_key,trigger_value_key,duration_field_key,calendar_id,priority,effective_from,effective_to,created_by_user_id,updated_by_user_id)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,CURRENT_TIMESTAMP),$11,$12,$12) RETURNING id`,
 [d.code,d.name,d.description??null,d.isActive??true,d.triggerFieldKey,d.triggerValueKey,d.durationFieldKey,d.calendarId,d.priority??100,d.effectiveFrom??null,d.effectiveTo??null,d.actorUserId??null]);
 return onePolicy(r.rows[0].id,tx);
}
async function updatePolicy(id,d,tx=null){
 const r=await ex(tx).query(`UPDATE sla_policies SET
 code=COALESCE($2,code),name=COALESCE($3,name),description=CASE WHEN $4::boolean THEN $5 ELSE description END,
 is_active=COALESCE($6,is_active),trigger_field_key=COALESCE($7,trigger_field_key),
 trigger_value_key=COALESCE($8,trigger_value_key),duration_field_key=COALESCE($9,duration_field_key),
 calendar_id=COALESCE($10,calendar_id),priority=COALESCE($11,priority),
 effective_from=COALESCE($12,effective_from),effective_to=CASE WHEN $13::boolean THEN $14 ELSE effective_to END,
 updated_by_user_id=$15 WHERE id=$1 RETURNING id`,
 [id,d.code??null,d.name??null,Object.hasOwn(d,"description"),d.description??null,d.isActive??null,d.triggerFieldKey??null,d.triggerValueKey??null,d.durationFieldKey??null,d.calendarId??null,d.priority??null,d.effectiveFrom??null,Object.hasOwn(d,"effectiveTo"),d.effectiveTo??null,d.actorUserId??null]);
 return r.rows[0]?onePolicy(id,tx):null;
}
async function setPolicyActive(id,active,actor,tx=null){
 const r=await ex(tx).query(`UPDATE sla_policies SET is_active=$2,updated_by_user_id=$3 WHERE id=$1 RETURNING id`,[id,active,actor??null]);
 return r.rows[0]?onePolicy(id,tx):null;
}
async function oneCalendar(id,tx=null){
 const r=await ex(tx).query(`${CALENDAR_SELECT} WHERE id=$1 LIMIT 1`,[id]); return r.rows[0]??null;
}
async function listCalendars({page=1,limit=20,search=null,isActive=null}={},tx=null){
 const where=[],params=[];let i=1;
 if(search){where.push(`(code ILIKE $${i} OR name ILIKE $${i})`);params.push(`%${search}%`);i++;}
 if(typeof isActive==="boolean"){where.push(`is_active=$${i}`);params.push(isActive);i++;}
 const clause=where.length?`WHERE ${where.join(" AND ")}`:"";
 const count=await ex(tx).query(`SELECT COUNT(*)::bigint total FROM sla_calendars ${clause}`,params);
 params.push(limit,(page-1)*limit);
 const rows=await ex(tx).query(`${CALENDAR_SELECT} ${clause} ORDER BY name LIMIT $${i} OFFSET $${i+1}`,params);
 return {rows:rows.rows,total:Number(count.rows[0]?.total??0)};
}
async function createCalendar(d,tx=null){
 const r=await ex(tx).query(`INSERT INTO sla_calendars(code,name,timezone,business_hours_per_day,workday_start_time,workday_end_time,include_saturday,include_sunday,is_active)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
 [d.code,d.name,d.timezone,d.businessHoursPerDay,d.workdayStartTime,d.workdayEndTime,d.includeSaturday,d.includeSunday,d.isActive]);
 return oneCalendar(r.rows[0].id,tx);
}
async function updateCalendar(id,d,tx=null){
 const r=await ex(tx).query(`UPDATE sla_calendars SET
 code=COALESCE($2,code),name=COALESCE($3,name),timezone=COALESCE($4,timezone),
 business_hours_per_day=COALESCE($5,business_hours_per_day),
 workday_start_time=COALESCE($6,workday_start_time),workday_end_time=COALESCE($7,workday_end_time),
 include_saturday=COALESCE($8,include_saturday),include_sunday=COALESCE($9,include_sunday),
 is_active=COALESCE($10,is_active) WHERE id=$1 RETURNING id`,
 [id,d.code??null,d.name??null,d.timezone??null,d.businessHoursPerDay??null,d.workdayStartTime??null,d.workdayEndTime??null,d.includeSaturday??null,d.includeSunday??null,d.isActive??null]);
 return r.rows[0]?oneCalendar(id,tx):null;
}
async function setCalendarActive(id,active,tx=null){
 const r=await ex(tx).query(`UPDATE sla_calendars SET is_active=$2 WHERE id=$1 RETURNING id`,[id,active]);return r.rows[0]?oneCalendar(id,tx):null;
}
async function listHolidays(calendarId,{year=null}={},tx=null){
 const params=[calendarId],where=["calendar_id=$1","is_active=TRUE"];
 if(year){params.push(`${year}-01-01`,`${year+1}-01-01`);where.push("holiday_date >= $2::date","holiday_date < $3::date");}
 const r=await ex(tx).query(`SELECT * FROM sla_calendar_holidays WHERE ${where.join(" AND ")} ORDER BY holiday_date`,params);return r.rows;
}
async function oneHoliday(id,tx=null){const r=await ex(tx).query(`SELECT * FROM sla_calendar_holidays WHERE id=$1 LIMIT 1`,[id]);return r.rows[0]??null;}
async function createHoliday(d,tx=null){const r=await ex(tx).query(`INSERT INTO sla_calendar_holidays(calendar_id,holiday_date,name,is_active) VALUES($1,$2,$3,$4) RETURNING id`,[d.calendarId,d.holidayDate,d.name,d.isActive??true]);return oneHoliday(r.rows[0].id,tx);}
async function updateHoliday(id,d,tx=null){const r=await ex(tx).query(`UPDATE sla_calendar_holidays SET holiday_date=COALESCE($2,holiday_date),name=COALESCE($3,name),is_active=COALESCE($4,is_active) WHERE id=$1 RETURNING id`,[id,d.holidayDate??null,d.name??null,d.isActive??null]);return r.rows[0]?oneHoliday(id,tx):null;}
async function oneTicket(id,tx=null){const r=await ex(tx).query(`${TICKET_SELECT} WHERE t.id=$1 LIMIT 1`,[id]);return r.rows[0]??null;}
async function oneTicketSla(ticketId,tx=null){const r=await ex(tx).query(`${SLA_SELECT} WHERE ts.ticket_id=$1 LIMIT 1`,[ticketId]);return r.rows[0]??null;}
async function runningSlas(limit=500,tx=null){const r=await ex(tx).query(`${SLA_SELECT} WHERE ts.status='RUNNING' ORDER BY ts.last_calculated_at NULLS FIRST LIMIT $1`,[limit]);return r.rows;}
async function upsertTicketSla(d,tx=null){
 const r=await ex(tx).query(`INSERT INTO ticket_sla(ticket_id,sla_policy_id,status,activated_at,paused_at,stopped_at,completed_at,breached_at,target_resolution_minutes,elapsed_business_minutes,remaining_business_minutes,last_calculated_at,activation_field_key,activation_field_value_key,duration_field_key,duration_field_value_key,policy_snapshot)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
 ON CONFLICT(ticket_id) DO UPDATE SET sla_policy_id=EXCLUDED.sla_policy_id,status=EXCLUDED.status,activated_at=EXCLUDED.activated_at,paused_at=EXCLUDED.paused_at,stopped_at=EXCLUDED.stopped_at,completed_at=EXCLUDED.completed_at,breached_at=EXCLUDED.breached_at,target_resolution_minutes=EXCLUDED.target_resolution_minutes,elapsed_business_minutes=EXCLUDED.elapsed_business_minutes,remaining_business_minutes=EXCLUDED.remaining_business_minutes,last_calculated_at=EXCLUDED.last_calculated_at,activation_field_key=EXCLUDED.activation_field_key,activation_field_value_key=EXCLUDED.activation_field_value_key,duration_field_key=EXCLUDED.duration_field_key,duration_field_value_key=EXCLUDED.duration_field_value_key,policy_snapshot=EXCLUDED.policy_snapshot RETURNING id`,
 [d.ticketId,d.slaPolicyId??null,d.status,d.activatedAt??null,d.pausedAt??null,d.stoppedAt??null,d.completedAt??null,d.breachedAt??null,d.targetResolutionMinutes??null,d.elapsedBusinessMinutes??0,d.remainingBusinessMinutes??null,d.lastCalculatedAt??null,d.activationFieldKey??null,d.activationFieldValueKey??null,d.durationFieldKey??null,d.durationFieldValueKey??null,d.policySnapshot??{}]);
 return oneTicketSla(d.ticketId,tx);
}
async function updateTicketSla(id,d,tx=null){
 const map=[["status",d.status],["activated_at",d.activatedAt],["paused_at",d.pausedAt],["stopped_at",d.stoppedAt],["completed_at",d.completedAt],["breached_at",d.breachedAt],["target_resolution_minutes",d.targetResolutionMinutes],["elapsed_business_minutes",d.elapsedBusinessMinutes],["remaining_business_minutes",d.remainingBusinessMinutes],["last_calculated_at",d.lastCalculatedAt],["activation_field_key",d.activationFieldKey],["activation_field_value_key",d.activationFieldValueKey],["duration_field_key",d.durationFieldKey],["duration_field_value_key",d.durationFieldValueKey],["policy_snapshot",d.policySnapshot]];
 const set=[],params=[id];let i=2;
 for(const [col,v] of map) if(v!==undefined){set.push(`${col}=$${i++}`);params.push(col==="policy_snapshot"?JSON.stringify(v):v);}
 if(!set.length)return null;
 const r=await ex(tx).query(`UPDATE ticket_sla SET ${set.join(",")} WHERE id=$1 RETURNING ticket_id`,params);
 return r.rows[0]?oneTicketSla(r.rows[0].ticket_id,tx):null;
}
async function createSegment(d,tx=null){const r=await ex(tx).query(`INSERT INTO ticket_sla_segments(ticket_sla_id,started_at,ended_at,trigger_value_key,duration_value_key,target_minutes,consumed_minutes,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[d.ticketSlaId,d.startedAt,d.endedAt??null,d.triggerValueKey,d.durationValueKey,d.targetMinutes,d.consumedMinutes??0,d.status??"RUNNING"]);return r.rows[0];}
async function closeSegment(id,endedAt,consumed,status,tx=null){const r=await ex(tx).query(`UPDATE ticket_sla_segments SET ended_at=$2,consumed_minutes=LEAST(GREATEST($3,0),target_minutes),status=$4 WHERE id=(SELECT id FROM ticket_sla_segments WHERE ticket_sla_id=$1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1) RETURNING *`,[id,endedAt,consumed,status]);return r.rows[0]??null;}
async function listSegments(id,tx=null){const r=await ex(tx).query(`SELECT * FROM ticket_sla_segments WHERE ticket_sla_id=$1 ORDER BY started_at DESC`,[id]);return r.rows;}
async function findRule(policyId,value,tx=null){const r=await ex(tx).query(`SELECT * FROM sla_policy_rules WHERE sla_policy_id=$1 AND field_value_key=$2 LIMIT 1`,[policyId,value]);return r.rows[0]??null;}
async function listRules(policyId,tx=null){const r=await ex(tx).query(`SELECT * FROM sla_policy_rules WHERE sla_policy_id=$1 ORDER BY field_value_key`,[policyId]);return r.rows;}
async function createRule(d,tx=null){const r=await ex(tx).query(`INSERT INTO sla_policy_rules(sla_policy_id,field_value_key,resolution_minutes,is_enabled) VALUES($1,$2,$3,$4) RETURNING *`,[d.policyId,d.fieldValueKey,d.resolutionMinutes,d.isEnabled??true]);return r.rows[0];}
async function updateRule(id,d,tx=null){const r=await ex(tx).query(`UPDATE sla_policy_rules SET field_value_key=COALESCE($2,field_value_key),resolution_minutes=CASE WHEN $3::boolean THEN $4 ELSE resolution_minutes END,is_enabled=COALESCE($5,is_enabled) WHERE id=$1 RETURNING *`,[id,d.fieldValueKey??null,Object.hasOwn(d,"resolutionMinutes"),d.resolutionMinutes??null,d.isEnabled??null]);return r.rows[0]??null;}

export default Object.freeze({onePolicy,listPolicies,applicablePolicy,createPolicy,updatePolicy,setPolicyActive,oneCalendar,listCalendars,createCalendar,updateCalendar,setCalendarActive,listHolidays,oneHoliday,createHoliday,updateHoliday,oneTicket,oneTicketSla,runningSlas,upsertTicketSla,updateTicketSla,createSegment,closeSegment,listSegments,findRule,listRules,createRule,updateRule});
