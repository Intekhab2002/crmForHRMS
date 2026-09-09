import { useEffect, useState } from "react";
import {
  Alert, Button, Divider, FormControlLabel, Paper, Stack, Switch, TextField, Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useNavigate, useParams } from "react-router";
import CanAccess from "../../../components/rbac/CanAccess";
import PageHeader from "../../../components/page/PageHeader";
import SlaHolidayCalendar from "../components/SlaHolidayCalendar";
import SlaHolidayDialog from "../components/SlaHolidayDialog";
import slaApi from "../services/sla.api";
import { SLA_PERMISSIONS, SLA_ROUTES } from "../config/sla.config";

export default function SlaCalendarDetailPage() {
  const { calendarId } = useParams();
  const navigate = useNavigate();
  const isNew = calendarId === "new";
  const [calendar, setCalendar] = useState({
    code: "", name: "", timezone: "Asia/Kolkata", businessHoursPerDay: 8,
    workdayStartTime: "09:00", workdayEndTime: "17:00", includeSaturday: false,
    includeSunday: false, isActive: true,
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [holidayDialog, setHolidayDialog] = useState({ open: false, holiday: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (isNew) return;
    setError("");
    try {
      const [item, list] = await Promise.all([slaApi.getCalendar(calendarId), slaApi.listHolidays(calendarId, year)]);
      setCalendar({
        code: item.code, name: item.name, timezone: item.timezone,
        businessHoursPerDay: Number(item.business_hours_per_day),
        workdayStartTime: item.workday_start_time?.slice(0, 5) ?? "09:00",
        workdayEndTime: item.workday_end_time?.slice(0, 5) ?? "17:00",
        includeSaturday: item.include_saturday,
        includeSunday: item.include_sunday,
        isActive: item.is_active,
      });
      setHolidays(list ?? []);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? requestError.message ?? "Unable to load calendar.");
    }
  };

  useEffect(() => { load(); }, [calendarId, year]);

  const saveCalendar = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: calendar.code.trim(),
        name: calendar.name.trim(),
        timezone: calendar.timezone.trim(),
        businessHoursPerDay: Number(calendar.businessHoursPerDay),
        workdayStartTime: calendar.workdayStartTime,
        workdayEndTime: calendar.workdayEndTime,
        includeSaturday: calendar.includeSaturday,
        includeSunday: calendar.includeSunday,
        isActive: calendar.isActive,
      };
      const item = isNew ? await slaApi.createCalendar(payload) : await slaApi.updateCalendar(calendarId, payload);
      if (isNew) navigate(SLA_ROUTES.calendarDetail(item.id), { replace: true });
      else await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? requestError.message ?? "Unable to save calendar.");
    } finally {
      setSaving(false);
    }
  };

  const saveHoliday = async (payload) => {
    setSaving(true);
    try {
      if (holidayDialog.holiday) await slaApi.updateHoliday(calendarId, holidayDialog.holiday.id, payload);
      else await slaApi.createHoliday(calendarId, payload);
      setHolidayDialog({ open: false, holiday: null });
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? requestError.message ?? "Unable to save holiday.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={isNew ? "Create SLA calendar" : calendar.name}
        description="Business time is authoritative on the server; this screen manages its configuration."
        actions={<Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(SLA_ROUTES.calendars)}>Back</Button>}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Typography variant="h6">Working calendar</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="Code" value={calendar.code} onChange={(e) => setCalendar({ ...calendar, code: e.target.value })} />
            <TextField fullWidth label="Name" value={calendar.name} onChange={(e) => setCalendar({ ...calendar, name: e.target.value })} />
            <TextField fullWidth label="Timezone" value={calendar.timezone} onChange={(e) => setCalendar({ ...calendar, timezone: e.target.value })} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth type="number" label="Business hours/day" value={calendar.businessHoursPerDay} onChange={(e) => setCalendar({ ...calendar, businessHoursPerDay: e.target.value })} inputProps={{ min: 0.01, max: 24, step: 0.5 }} />
            <TextField fullWidth type="time" label="Workday start" value={calendar.workdayStartTime} onChange={(e) => setCalendar({ ...calendar, workdayStartTime: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth type="time" label="Workday end" value={calendar.workdayEndTime} onChange={(e) => setCalendar({ ...calendar, workdayEndTime: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControlLabel control={<Switch checked={calendar.includeSaturday} onChange={(e) => setCalendar({ ...calendar, includeSaturday: e.target.checked })} />} label="Include Saturday" />
            <FormControlLabel control={<Switch checked={calendar.includeSunday} onChange={(e) => setCalendar({ ...calendar, includeSunday: e.target.checked })} />} label="Include Sunday" />
            <FormControlLabel control={<Switch checked={calendar.isActive} onChange={(e) => setCalendar({ ...calendar, isActive: e.target.checked })} />} label={calendar.isActive ? "Active" : "Inactive"} />
          </Stack>
          <Divider />
          <CanAccess permission={SLA_PERMISSIONS.calendarUpdate}>
            <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={saveCalendar} disabled={saving || !calendar.code.trim() || !calendar.name.trim()}>
              {saving ? "Saving…" : "Save calendar"}
            </Button>
          </CanAccess>
        </Stack>
      </Paper>
      {!isNew ? (
        <Paper variant="outlined" sx={{ p: { xs: 1, md: 2 } }}>
          <SlaHolidayCalendar
            year={year}
            holidays={holidays}
            onYearChange={setYear}
            onAdd={() => setHolidayDialog({ open: true, holiday: null })}
            onEdit={(holiday) => setHolidayDialog({ open: true, holiday })}
            onDelete={async (holiday) => {
              if (!window.confirm(`Remove holiday “${holiday.name}”?`)) return;
              await slaApi.deleteHoliday(calendarId, holiday.id);
              await load();
            }}
            canCreate={!isNew}
            canUpdate={!isNew}
            canDelete={!isNew}
          />
        </Paper>
      ) : null}
      <SlaHolidayDialog
        open={holidayDialog.open}
        holiday={holidayDialog.holiday}
        onClose={() => setHolidayDialog({ open: false, holiday: null })}
        onSave={saveHoliday}
        saving={saving}
      />
    </Stack>
  );
}
