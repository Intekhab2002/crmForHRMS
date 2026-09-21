import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useLocation, useNavigate, useParams } from "react-router";
import CanAccess from "../../../components/rbac/CanAccess";
import PageHeader from "../../../components/page/PageHeader";
import SlaHolidayCalendar from "../components/SlaHolidayCalendar";
import SlaHolidayDialog from "../components/SlaHolidayDialog";
import slaApi from "../services/sla.api";
import { SLA_PERMISSIONS, SLA_ROUTES } from "../config/sla.config";
import SlaHolidayList from "../components/SlaHolidayList";
import SlaHolidayExcelActions from "../components/SlaHolidayExcelActions";
import { moveMonth } from "../utils/slaCalendar";

export default function SlaCalendarDetailPage() {
  const { calendarId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const createCalendarPath = `${SLA_ROUTES.calendars}/new`;

  const isNew = location.pathname === createCalendarPath;

  const hasCalendarId =
    typeof calendarId === "string" && calendarId.trim().length > 0;
  const [calendar, setCalendar] = useState({
    code: "",
    name: "",
    timezone: "Asia/Kolkata",
    businessHoursPerDay: 8,
    workdayStartTime: "09:00",
    workdayEndTime: "17:00",
    includeSaturday: false,
    includeSunday: false,
    isActive: true,
  });
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [holidays, setHolidays] = useState([]);
  const [holidayDialog, setHolidayDialog] = useState({
    open: false,
    holiday: null,
    initialDate: "",
  });
  const [deletingHoliday, setDeletingHoliday] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCalendar = async () => {
    if (isNew || !hasCalendarId) {
      return;
    }

    const item = await slaApi.getCalendar(calendarId);

    setCalendar({
      code: item.code,
      name: item.name,
      timezone: item.timezone,
      businessHoursPerDay: Number(item.business_hours_per_day),
      workdayStartTime: item.workday_start_time?.slice(0, 5) ?? "09:00",
      workdayEndTime: item.workday_end_time?.slice(0, 5) ?? "17:00",
      includeSaturday: item.include_saturday,
      includeSunday: item.include_sunday,
      isActive: item.is_active,
    });
  };

  const loadHolidays = async (targetYear = year) => {
    if (isNew || !hasCalendarId) {
      return;
    }

    const list = await slaApi.listHolidays(calendarId, targetYear);

    setHolidays(list ?? []);
  };

  const load = async () => {
    if (isNew || !hasCalendarId) {
      return;
    }

    setError("");

    try {
      await Promise.all([loadCalendar(), loadHolidays(year)]);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.message ??
          "Unable to load calendar.",
      );
    }
  };

  useEffect(() => {
    load();
  }, [calendarId]);

  useEffect(() => {
    if (!isNew && hasCalendarId) {
      loadHolidays(year).catch((requestError) => {
        setError(
          requestError.response?.data?.message ??
            requestError.message ??
            "Unable to load holidays.",
        );
      });
    }
  }, [year, calendarId]);

  const handleMonthChange = (offset) => {
    const next = moveMonth(year, monthIndex, offset);

    setYear(next.year);
    setMonthIndex(next.monthIndex);
  };

  const openHolidayForDate = (dateKey) => {
    setHolidayDialog({
      open: true,
      holiday: null,
      initialDate: dateKey,
    });
  };

  const openHolidayForEdit = (holiday) => {
    setHolidayDialog({
      open: true,
      holiday,
      initialDate: holiday.holiday_date,
    });
  };

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
      const item = isNew
        ? await slaApi.createCalendar(payload)
        : await slaApi.updateCalendar(calendarId, payload);
      if (isNew)
        navigate(SLA_ROUTES.calendarDetail(item.id), { replace: true });
      else await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.message ??
          "Unable to save calendar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveHoliday = async (payload) => {
    if (isNew || !hasCalendarId) {
      setError("Save the calendar before adding holidays.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (holidayDialog.holiday) {
        await slaApi.updateHoliday(
          calendarId,
          holidayDialog.holiday.id,
          payload,
        );
      } else {
        await slaApi.createHoliday(calendarId, payload);
      }

      setHolidayDialog({
        open: false,
        holiday: null,
        initialDate: "",
      });

      await loadHolidays(year);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.message ??
          "Unable to save holiday.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteHoliday = async (holiday) => {
    if (!holiday?.id) {
      return;
    }

    if (!window.confirm(`Remove holiday “${holiday.name}”?`)) {
      return;
    }

    setDeletingHoliday(true);
    setError("");

    try {
      await slaApi.deleteHoliday(calendarId, holiday.id);

      setHolidayDialog({
        open: false,
        holiday: null,
        initialDate: "",
      });

      await loadHolidays(year);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.message ??
          "Unable to remove holiday.",
      );
    } finally {
      setDeletingHoliday(false);
    }
  };

  return (
    <>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }}>
          <PageHeader
            title={isNew ? "Create SLA calendar" : calendar.name}
            description="Business time is authoritative on the server; this screen manages its configuration."
            actions={
              <Button
                variant="outlined"
                startIcon={<ArrowBackOutlinedIcon />}
                onClick={() => navigate(SLA_ROUTES.calendars)}
              >
                Back
              </Button>
            }
          />
        </Grid>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={1}>
              <Typography variant="h6">Working calendar</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Code"
                  value={calendar.code}
                  onChange={(e) =>
                    setCalendar({ ...calendar, code: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="Name"
                  value={calendar.name}
                  onChange={(e) =>
                    setCalendar({ ...calendar, name: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="Timezone"
                  value={calendar.timezone}
                  onChange={(e) =>
                    setCalendar({ ...calendar, timezone: e.target.value })
                  }
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Business hours/day"
                  value={calendar.businessHoursPerDay}
                  onChange={(e) =>
                    setCalendar({
                      ...calendar,
                      businessHoursPerDay: e.target.value,
                    })
                  }
                  inputProps={{ min: 0.01, max: 24, step: 0.5 }}
                />
                <TextField
                  fullWidth
                  type="time"
                  label="Workday start"
                  value={calendar.workdayStartTime}
                  onChange={(e) =>
                    setCalendar({
                      ...calendar,
                      workdayStartTime: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type="time"
                  label="Workday end"
                  value={calendar.workdayEndTime}
                  onChange={(e) =>
                    setCalendar({ ...calendar, workdayEndTime: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={calendar.includeSaturday}
                      onChange={(e) =>
                        setCalendar({
                          ...calendar,
                          includeSaturday: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Include Saturday"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={calendar.includeSunday}
                      onChange={(e) =>
                        setCalendar({
                          ...calendar,
                          includeSunday: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Include Sunday"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={calendar.isActive}
                      onChange={(e) =>
                        setCalendar({ ...calendar, isActive: e.target.checked })
                      }
                    />
                  }
                  label={calendar.isActive ? "Active" : "Inactive"}
                />
              </Stack>
              <Divider />
              <CanAccess permission={SLA_PERMISSIONS.calendarUpdate}>
                <Button
                  variant="contained"
                  startIcon={<SaveOutlinedIcon />}
                  onClick={saveCalendar}
                  disabled={
                    saving || !calendar.code.trim() || !calendar.name.trim()
                  }
                >
                  {saving ? "Saving…" : "Save calendar"}
                </Button>
              </CanAccess>
            </Stack>
          </Paper>
        </Grid>
        {!isNew ? (
          <>
            <Grid size={{ xs: 12, md: 8 }}>
              <SlaHolidayCalendar
                year={year}
                monthIndex={monthIndex}
                holidays={holidays}
                onMonthChange={handleMonthChange}
                onDateClick={openHolidayForDate}
                onEdit={openHolidayForEdit}
                onDelete={deleteHoliday}
                canCreate
                canUpdate
                canDelete
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SlaHolidayList
                year={year}
                holidays={holidays}
                onHolidayClick={openHolidayForEdit}
              />
            </Grid>
            <Grid size={12}>
              <SlaHolidayExcelActions
                calendarId={calendarId}
                year={year}
                onImported={() => loadHolidays(year)}
              />
            </Grid>
          </>
        ) : null}
      </Grid>
      <SlaHolidayDialog
        open={holidayDialog.open}
        holiday={holidayDialog.holiday}
        initialDate={holidayDialog.initialDate}
        onClose={() =>
          setHolidayDialog({
            open: false,
            holiday: null,
            initialDate: "",
          })
        }
        onSave={saveHoliday}
        onDelete={deleteHoliday}
        saving={saving}
        deleting={deletingHoliday}
        canDelete
      />
    </>
  );
}
