import { useMemo } from "react";
import {
  Box, Button, IconButton, Paper, Stack, Tooltip, Typography,
} from "@mui/material";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { formatDate } from "../utils/slaFormatters";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SlaHolidayCalendar({ year, holidays, onYearChange, onAdd, onEdit, onDelete, canCreate, canUpdate, canDelete }) {
  const holidayMap = useMemo(() => new Map(
    (holidays ?? []).map((holiday) => [holiday.holiday_date, holiday]),
  ), [holidays]);

  const cells = useMemo(() => {
    const first = new Date(year, 0, 1);
    const start = (first.getDay() + 6) % 7;
    const days = new Date(year, 11, 31).getDate() + 334;
    const total = new Date(year, 11, 31).getDate() + start + (new Date(year, 11, 31).getDay() || 7) - 1;
    const result = [];
    for (let i = 0; i < start; i += 1) result.push(null);
    for (let day = 1; day <= 365 + (new Date(year, 1, 29).getMonth() === 1 ? 1 : 0); day += 1) {
      const date = new Date(year, 0, day);
      if (date.getFullYear() !== year) break;
      result.push(date);
    }
    while (result.length < total) result.push(null);
    return result;
  }, [year]);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <IconButton onClick={() => onYearChange(year - 1)} aria-label={`Previous year, ${year - 1}`}><ChevronLeftOutlinedIcon /></IconButton>
          <Typography variant="h6" component="h2" sx={{ minWidth: 110, textAlign: "center" }}>{year}</Typography>
          <IconButton onClick={() => onYearChange(year + 1)} aria-label={`Next year, ${year + 1}`}><ChevronRightOutlinedIcon /></IconButton>
        </Stack>
        {canCreate ? <Button size="small" variant="outlined" startIcon={<AddOutlinedIcon />} onClick={onAdd}>Add holiday</Button> : null}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 0.75 }}>
        {WEEKDAYS.map((day) => <Typography key={day} variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: "center", py: 0.5 }}>{day}</Typography>)}
        {cells.map((date, index) => {
          if (!date) return <Box key={`blank-${index}`} sx={{ minHeight: 70 }} />;
          const key = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const holiday = holidayMap.get(key);
          return (
            <Box key={key} sx={{ minHeight: 70, p: 1, border: 1, borderColor: holiday ? "primary.main" : "divider", borderRadius: 1.5, bgcolor: holiday ? "action.selected" : "background.paper" }}>
              <Typography variant="body2" fontWeight={700}>{date.getDate()}</Typography>
              {holiday ? (
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" noWrap title={holiday.name}>{holiday.name}</Typography>
                  <Stack direction="row" spacing={0.25}>
                    {canUpdate ? <Tooltip title="Edit holiday"><IconButton size="small" aria-label={`Edit ${holiday.name}`} onClick={() => onEdit(holiday)}><EditOutlinedIcon fontSize="inherit" /></IconButton></Tooltip> : null}
                    {canDelete ? <Tooltip title="Remove holiday"><IconButton size="small" aria-label={`Remove ${holiday.name}`} onClick={() => onDelete(holiday)}><DeleteOutlineIcon fontSize="inherit" /></IconButton></Tooltip> : null}
                  </Stack>
                </Stack>
              ) : null}
            </Box>
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        {holidays?.length ?? 0} active holiday{holidays?.length === 1 ? "" : "s"} in {year}.
      </Typography>
    </Paper>
  );
}
