import { useMemo } from "react";
import {
  Box, Checkbox, IconButton, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { formatDurationMinutes } from "../utils/slaFormatters";

export default function SlaDurationRuleTable({ values, options, onChange }) {
  const rows = useMemo(() => {
    const existing = new Map((values ?? []).map((item) => [item.fieldValueKey, item]));
    return (options ?? []).map((option) => ({
      fieldValueKey: option.value,
      label: option.label,
      resolutionMinutes: existing.get(option.value)?.resolutionMinutes ?? null,
      isEnabled: existing.get(option.value)?.isEnabled ?? true,
    }));
  }, [values, options]);

  const update = (fieldValueKey, patch) => {
    onChange(rows.map((row) => (
      row.fieldValueKey === fieldValueKey ? { ...row, ...patch } : row
    )));
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="SLA duration rules">
        <TableHead>
          <TableRow>
            <TableCell>Value</TableCell>
            <TableCell width={180}>Resolution minutes</TableCell>
            <TableCell width={150}>Tracking</TableCell>
            <TableCell width={70} align="right">Remove</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length ? rows.map((row) => (
            <TableRow key={row.fieldValueKey} hover>
              <TableCell>
                <Typography fontWeight={600}>{row.label}</Typography>
                <Typography variant="caption" color="text.secondary">{row.fieldValueKey}</Typography>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  inputProps={{ min: 1, step: 1, "aria-label": `${row.label} resolution minutes` }}
                  value={row.resolutionMinutes ?? ""}
                  placeholder="No SLA"
                  onChange={(event) => update(row.fieldValueKey, {
                    resolutionMinutes: event.target.value === "" ? null : Number(event.target.value),
                  })}
                  helperText={row.resolutionMinutes ? formatDurationMinutes(row.resolutionMinutes) : "Not tracked"}
                />
              </TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center">
                  <Checkbox
                    checked={row.isEnabled}
                    onChange={(event) => update(row.fieldValueKey, { isEnabled: event.target.checked })}
                    inputProps={{ "aria-label": `Enable ${row.label} SLA rule` }}
                  />
                  <Typography variant="body2">{row.isEnabled ? "Enabled" : "Disabled"}</Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Remove rule">
                  <IconButton
                    size="small"
                    aria-label={`Remove ${row.label} rule`}
                    onClick={() => onChange(rows.filter((item) => item.fieldValueKey !== row.fieldValueKey))}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={4}><Box p={3} textAlign="center">No values available.</Box></TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
