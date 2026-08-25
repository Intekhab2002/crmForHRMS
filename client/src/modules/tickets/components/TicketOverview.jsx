import { useMemo } from "react";
import { Divider, Grid, Paper, Stack, Typography } from "@mui/material";

import OptionChip from "../../../components/display/OptionChip";

import {
  formatDateTime,
  formatTicketValue,
  getField,
} from "../utils/ticketFormatters";

import { useAuth } from "../../../context/useAuth";

const METADATA_FIELDS = [
  {
    key: "createdAt",
    label: "Created",
    type: "dateTime",
  },
  {
    key: "updatedAt",
    label: "Last updated",
    type: "dateTime",
  },
];

function canReadField(field, enforcePermissions, hasPermission) {
  if (!enforcePermissions) {
    return true;
  }

  const permission = field.permissions?.read ?? field.permission;

  return !permission || hasPermission(permission);
}

function renderValue(field, ticket, fallback) {
  const value = ticket[field.key];

  if (field.type === "dateTime") {
    return formatDateTime(value, fallback);
  }

  if (
    field.type === "select" &&
    Array.isArray(field.options) &&
    field.options.some((option) => option.color)
  ) {
    return (
      <OptionChip value={value} options={field.options} fallback={fallback} />
    );
  }

  return formatTicketValue(field, value, fallback);
}

export default function TicketOverview({
  ticket,
  fields = [],
  fieldNames = [],
  title,
  fallback = "Not available",
  enforcePermissions = true,
}) {
  const { hasPermission } = useAuth();

  const visibleFields = useMemo(
    () =>
      fieldNames
        .map((key) => getField(fields, key) ?? getField(METADATA_FIELDS, key))
        .filter(Boolean)
        .filter((field) =>
          canReadField(field, enforcePermissions, hasPermission),
        ),
    [enforcePermissions, fieldNames, fields, hasPermission],
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
      }}
    >
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
            <Grid
              key={field.key}
              size={
                field.grid ?? {
                  xs: 12,
                  md: 4,
                }
              }
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {field.label}
                </Typography>

                <Typography
                  component="div"
                  fontWeight={600}
                  sx={{
                    whiteSpace:
                      field.type === "textarea" ? "pre-wrap" : "normal",
                    wordBreak: "break-word",
                  }}
                >
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
