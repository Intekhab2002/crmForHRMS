import assert from "node:assert/strict";
import test from "node:test";
import { isBusinessDay,isBusinessInstant } from "../../src/modules/sla/businessCalendar.service.js";
const c={timezone:"Asia/Kolkata",workday_start_time:"09:00:00",workday_end_time:"17:00:00",include_saturday:false,include_sunday:false};
test("weekend excluded",()=>{assert.equal(isBusinessDay("2026-09-12T10:00:00+05:30",c),false);});
test("holiday excluded",()=>{assert.equal(isBusinessDay("2026-09-10T10:00:00+05:30",c,["2026-09-10"]),false);});
test("business instant",()=>{assert.equal(isBusinessInstant("2026-09-10T10:00:00+05:30",c),true);});
