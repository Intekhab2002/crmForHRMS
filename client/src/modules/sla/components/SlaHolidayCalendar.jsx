import { useMemo } from "react";
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import {
  formatMonthYear,
  getMonthCells,
  isToday,
} from "../utils/slaCalendar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SlaHolidayCalendar({
  year,
  monthIndex,
  holidays = [],
  onMonthChange,
  onDateClick,
  onEdit,
  onDelete,
  canCreate,
  canUpdate,
  canDelete,
}) {
  const holidayMap = useMemo(
    () =>
      new Map(
        holidays.map((holiday) => [
          holiday.holiday_date,
          holiday,
        ]),
      ),
    [holidays],
  );

  const cells = useMemo(
    () => getMonthCells(year, monthIndex),
    [year, monthIndex],
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2 },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
        >
          <IconButton
            onClick={() => onMonthChange(-1)}
            aria-label="Previous month"
          >
            <ChevronLeftOutlinedIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="h2"
            sx={{
              minWidth: { xs: 180, sm: 220 },
              textAlign: "center",
            }}
          >
            {formatMonthYear(year, monthIndex)}
          </Typography>

          <IconButton
            onClick={() => onMonthChange(1)}
            aria-label="Next month"
          >
            <ChevronRightOutlinedIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: { xs: 0.5, sm: 0.75 },
        }}
      >
        {WEEKDAYS.map((day) => (
          <Typography
            key={day}
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{
              textAlign: "center",
              py: 0.75,
            }}
          >
            {day}
          </Typography>
        ))}

        {cells.map((cell, index) => {
          if (!cell) {
            return (
              <Box
                key={`blank-${index}`}
                sx={{
                  minHeight: { xs: 76, sm: 92 },
                }}
              />
            );
          }

          const holiday = holidayMap.get(cell.dateKey);
          const today = isToday(cell.dateKey);

          return (
            <Paper
              key={cell.dateKey}
              variant="outlined"
              component="button"
              type="button"
              onClick={() => onDateClick(cell.dateKey)}
              sx={{
                minHeight: { xs: 76, sm: 92 },
                p: { xs: 0.75, sm: 1 },
                textAlign: "left",
                cursor: "pointer",
                borderColor: holiday
                  ? "primary.main"
                  : today
                    ? "secondary.main"
                    : "divider",
                bgcolor: holiday
                  ? "action.selected"
                  : "background.paper",
                position: "relative",
                transition: "border-color 120ms ease, background-color 120ms ease",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
                "&:focus-visible": {
                  outline: 2,
                  outlineOffset: 1,
                  outlineColor: "primary.main",
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography
                  variant="body2"
                  fontWeight={today || holiday ? 700 : 500}
                >
                  {cell.day}
                </Typography>

                {today ? (
                  <Typography
                    variant="caption"
                    color="primary"
                    fontWeight={700}
                  >
                    Today
                  </Typography>
                ) : null}
              </Stack>

              {holiday ? (
                <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={holiday.name}
                  >
                    {holiday.name}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={0.25}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {canUpdate ? (
                      <Tooltip title="Edit holiday">
                        <IconButton
                          size="small"
                          aria-label={`Edit ${holiday.name}`}
                          onClick={() => onEdit(holiday)}
                        >
                          <EditOutlinedIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    ) : null}

                    {canDelete ? (
                      <Tooltip title="Remove holiday">
                        <IconButton
                          size="small"
                          aria-label={`Remove ${holiday.name}`}
                          onClick={() => onDelete(holiday)}
                        >
                          <DeleteOutlineIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Stack>
                </Stack>
              ) : (
                canCreate ? (
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    sx={{
                      mt: 1,
                      opacity: 0.55,
                    }}
                  >
                    <AddOutlinedIcon fontSize="small" />
                  </Stack>
                ) : null
              )}
            </Paper>
          );
        })}
      </Box>
    </Paper>
  );
}