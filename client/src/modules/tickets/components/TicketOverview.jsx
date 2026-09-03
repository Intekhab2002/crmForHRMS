import { useMemo } from "react";
import { Divider, Grid, Paper, Stack, Typography } from "@mui/material";

import OptionChip from "../../../components/display/OptionChip";

import {
  formatDate,
  formatDateTime,
  formatTicketValue,
} from "../utils/ticketFormatters";

import { useAuth } from "../../../context/useAuth";


/*
 * Fields whose persisted value is an ID but whose API response
 * already contains the corresponding human-readable display value.
 */
const DISPLAY_VALUE_FIELDS = Object.freeze({
  department: "departmentName",
  assigned_to: "assignedUserName",
  created_by: "createdByName",
  organization: "organizationName",
  caller_department: "callerDepartmentName",
});

function canReadField(field, enforcePermissions, hasPermission) {
  if (!enforcePermissions) {
    return true;
  }

  const permission = field.permissions?.read ?? field.permission;

  return !permission || hasPermission(permission);
}

function getDisplayValue(field, ticket) {
  const displayKey = DISPLAY_VALUE_FIELDS[field.key];

  if (!displayKey) {
    return undefined;
  }

  return ticket[displayKey];
}

function getFieldValue(field, ticket) {
  if (!field || !ticket) {
    return undefined;
  }

  return ticket[field.key];
}

function renderValue(field, ticket, fallback) {
  // const value = ticket[field.key];
  const value = getFieldValue(field, ticket);


  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (field.type === "dateTime") {
    return formatDateTime(value, fallback);
  }

  if (field.type === "date") {
    return formatDate(value, fallback);
  }

  /*
   * Prefer API-provided display values for
   * relational/API-backed fields.
   */
  const displayValue = getDisplayValue(field, ticket);

  if (
    displayValue !== undefined &&
    displayValue !== null &&
    displayValue !== ""
  ) {
    return displayValue;
  }

  /*
   * Static select fields have an array of options.
   * Dynamic API fields have an options descriptor object,
   * so formatTicketValue must not call .find() on them.
   */
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
  const visibleFields = useMemo(() => {
    const detailFieldKeys = new Set(fieldNames);

    return fields
      .filter((field) => detailFieldKeys.has(field.key))
      .filter((field) =>
        canReadField(field, enforcePermissions, hasPermission),
      );
  }, [enforcePermissions, fieldNames, fields, hasPermission]);
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
          {visibleFields.map((field) => {
            return (
              <Grid
                key={field.key}
                size={{
                  xs: 12,
                  sm: 6,
                  md: field.type === "textarea" ? 12 : 6,
                }}
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
                      minHeight: "1.5rem",
                    }}
                  >
                    {renderValue(field, ticket, fallback)}
                  </Typography>
                </Stack>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </Paper>
  );
}
