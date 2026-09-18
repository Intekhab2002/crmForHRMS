import { useMemo } from "react";
import {
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import { formatLongDate } from "../utils/slaCalendar";

export default function SlaHolidayList({
  year,
  holidays = [],
  onHolidayClick,
}) {
  const items = useMemo(
    () =>
      [...holidays].sort((a, b) =>
        String(a.holiday_date).localeCompare(String(b.holiday_date)),
      ),
    [holidays],
  );

  return (
    <Paper variant="outlined">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ p: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <EventOutlinedIcon fontSize="small" color="action" />
          <Typography variant="h6" component="h2">
            Holidays
          </Typography>
        </Stack>

        <Chip
          size="small"
          label={`${items.length} ${items.length === 1 ? "holiday" : "holidays"}`}
        />
      </Stack>

      <Divider />

      {items.length === 0 ? (
        <Stack spacing={0.5} sx={{ p: 2.5 }}>
          <Typography variant="body2">
            No holidays configured for {year}.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click any date in the calendar to add a holiday.
          </Typography>
        </Stack>
      ) : (
        <List disablePadding>
          {items.map((holiday, index) => (
            <ListItemButton
              key={holiday.id}
              onClick={() => onHolidayClick?.(holiday)}
              divider={index < items.length - 1}
              aria-label={`Open ${holiday.name}, ${formatLongDate(
                holiday.holiday_date,
              )}`}
            >
              <ListItemText
                primary={holiday.name}
                secondary={formatLongDate(holiday.holiday_date)}
              />
              <ChevronRightOutlinedIcon color="action" />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
}
