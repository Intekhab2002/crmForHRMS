import  { useMemo } from "react";
import { Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import OptionChip from "../../../components/display/OptionChip";
import {
  formatDateTime,
  formatTicketValue,
  getField,
} from "../utils/ticketFormatters";
import { useAuth } from "../../../context/useAuth";

const METADATA_FIELDS = [
  { name: "createdAt", label: "Created", type: "dateTime" },
  { name: "updatedAt", label: "Last updated", type: "dateTime" },
];

function canReadField(field, enforcePermissions, hasPermission) {
  if (!enforcePermissions) return true;

  const permission = field.permissions?.read ?? field.permission;
  return !permission || hasPermission(permission);
}

function renderValue(field, ticket, fallback) {
  const value = ticket[field.name];

  if (field.type === "dateTime") {
    return formatDateTime(value, fallback);
  }

  if (field.type === "select" && field.options?.some((option) => option.color)) {
    return <OptionChip value={value} options={field.options} fallback={fallback} />;
  }

  return formatTicketValue(field, value, fallback);
}

export default function TicketOverview({
  ticket,
  fields,
  fieldNames,
  title,
  fallback = "Not available",
  enforcePermissions = true,
}) {
  const { hasPermission } = useAuth();
  const visibleFields = useMemo(
    () =>
      fieldNames
        .map((name) => getField(fields, name) ?? getField(METADATA_FIELDS, name))
        .filter(Boolean)
        .filter((field) => canReadField(field, enforcePermissions, hasPermission)),
    [enforcePermissions, fieldNames, fields, hasPermission],
  );

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        {title ? (
          <>
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
            <Divider />
          </>
        ) : null}

        <Grid container spacing={2}>
          {visibleFields.map((field) => (
            <Grid key={field.name} size={field.grid ?? { xs: 12, md: 4 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {field.label}
                </Typography>
                <Typography component="div" fontWeight={600}>
                  {renderValue(field, ticket, fallback)}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Paper>
  );
}
