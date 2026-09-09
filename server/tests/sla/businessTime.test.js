import assert from "node:assert/strict";
import test from "node:test";
import { calculateBusinessMinutes,addBusinessMinutes } from "../../src/modules/sla/businessTime.service.js";
const c={timezone:"Asia/Kolkata",business_hours_per_day:8,workday_start_time:"09:00:00",workday_end_time:"17:00:00",include_saturday:false,include_sunday:false};
test("calculates four business hours",()=>assert.equal(calculateBusinessMinutes({startAt:"2026-09-10T09:00:00+05:30",endAt:"2026-09-10T13:00:00+05:30",calendar:c}),240));
test("skips weekend",()=>assert.equal(calculateBusinessMinutes({startAt:"2026-09-11T16:00:00+05:30",endAt:"2026-09-14T10:00:00+05:30",calendar:c}),120));
test("adds business minutes",()=>assert.equal(addBusinessMinutes({startAt:"2026-09-10T09:00:00+05:30",businessMinutes:480,calendar:c,holidays:["2026-09-11"]}).toISOString(),"2026-09-14T11:30:00.000Z"));
