import { useMemo } from "react";

import {
  Box,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";

import OptionChip from "../../../components/display/OptionChip";

import {
  formatDate,
  formatDateTime,
  formatTicketValue,
} from "../utils/ticketFormatters";

import {
  TICKET_DETAIL_GROUPS,
  TICKET_DETAIL_FULL_WIDTH_FIELDS,
  TICKET_DETAIL_SYSTEM_FIELDS,
} from "../config/ticketDetails.config";

import { useAuth } from "../../../context/useAuth";

const DISPLAY_VALUE_FIELDS = Object.freeze({
  status: "statusName",
  organization: "organizationName",
  department: "departmentName",
  assigned_to: "assignedUserName",
  created_by: "createdByName",
  district: "districtName",
  caller_department: "callerDepartmentName",
  service_type: "serviceTypeName",
  category: "categoryName",
  problem_statement: "problemStatementName",
  current_bill_status: "currentBillStatusName",
  severity: "severityName",
  issue_category: "issueCategoryName",
  dependency_category: "dependencyCategoryName",
});

function canReadField(field, enforcePermissions, hasPermission) {
  if (!enforcePermissions) return true;

  const permission = field.permissions?.read ?? field.permission;

  return !permission || hasPermission(permission);
}

function getFieldValue(field, ticket, fallback) {
  const value = ticket?.[field.key];

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (field.type === "dateTime") {
    return formatDateTime(value, fallback);
  }

  if (field.type === "date") {
    return formatDate(value, fallback);
  }

  const displayKey = DISPLAY_VALUE_FIELDS[field.key];
  const displayValue = displayKey ? ticket?.[displayKey] : null;

  if (
    displayValue !== null &&
    displayValue !== undefined &&
    displayValue !== ""
  ) {
    return displayValue;
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

  return formatTicketValue(field, value, fallback, ticket);
}

function getDisplayField(key, fieldMap) {
  return fieldMap.get(key) ?? TICKET_DETAIL_SYSTEM_FIELDS[key] ?? null;
}

function DetailLabel({ children }) {
  return (
    <TableCell
      component="th"
      scope="row"
      sx={{
        width: "16%",
        minWidth: 110,
        fontWeight: 700,
        color: "text.secondary",
        verticalAlign: "top",
        whiteSpace: "normal",
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </TableCell>
  );
}

function DetailValue({ children, colSpan = 1 }) {
  return (
    <TableCell
      colSpan={colSpan}
      sx={{
        width: colSpan === 3 ? "84%" : "34%",
        minWidth: 0,
        verticalAlign: "top",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        wordBreak: "normal",
        lineHeight: 1.6,
      }}
    >
      {children}
    </TableCell>
  );
}

function DetailRow({ field, ticket, fallback }) {
  const value = getFieldValue(field, ticket, fallback);

  const fullWidth = TICKET_DETAIL_FULL_WIDTH_FIELDS.includes(field.key);

  return (
    <TableRow
      sx={{
        "&:last-child td, &:last-child th": {
          borderBottom: 0,
        },
      }}
    >
      <DetailLabel>{field.label}</DetailLabel>
      <DetailValue colSpan={fullWidth ? 3 : 1}>{value}</DetailValue>
    </TableRow>
  );
}

function DetailTable({ groups, ticket, fallback }) {
  const rows = [];

  for (const group of groups) {
    // Section heading
    rows.push(
      <TableRow
        key={`group-${group.key}`}
        sx={{
          backgroundColor: "action.hover",
          "& td": {
            borderBottom: "1px solid",
            borderColor: "rgba(0, 0, 0, 0.07)",
            py: 1.25,
          },
        }}
      >
        <TableCell colSpan={4}>
          <Typography variant="subtitle2" fontWeight={700}>
            {group.title}
          </Typography>
        </TableCell>
      </TableRow>,
    );

    let normalFields = [];

    const flushNormalFields = () => {
      for (let index = 0; index < normalFields.length; index += 2) {
        const first = normalFields[index];
        const second = normalFields[index + 1];

        rows.push(
          <TableRow key={`${group.key}-${first.key}`}>
            <DetailLabel>{first.label}</DetailLabel>

            <DetailValue>{getFieldValue(first, ticket, fallback)}</DetailValue>

            {second ? (
              <>
                <DetailLabel>{second.label}</DetailLabel>

                <DetailValue>
                  {getFieldValue(second, ticket, fallback)}
                </DetailValue>
              </>
            ) : (
              <TableCell colSpan={2} />
            )}
          </TableRow>,
        );
      }

      normalFields = [];
    };

    for (const field of group.fields) {
      if (TICKET_DETAIL_FULL_WIDTH_FIELDS.includes(field.key)) {
        flushNormalFields();

        rows.push(
          <DetailRow
            key={`${group.key}-${field.key}`}
            field={field}
            ticket={ticket}
            fallback={fallback}
          />,
        );
      } else {
        normalFields.push(field);
      }
    }

    flushNormalFields();
  }

  return (
    <TableContainer
      sx={{
        width: "100%",
        overflowX: "auto",
        border: "1px solid",
        borderColor: "rgba(0, 0, 0, 0.07)",
        borderRadius: 2,
      }}
    >
      <Table
        size="small"
        aria-label="Ticket details"
        sx={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",

          "& td, & th": {
            borderBottom: "1px solid",
            borderColor: "rgba(0, 0, 0, 0.06)",
            px: 2,
            py: 1.5,
          },

          "& tr:last-child td, & tr:last-child th": {
            borderBottom: 0,
          },
        }}
      >
        <TableBody>{rows}</TableBody>
      </Table>
    </TableContainer>
  );
}

export default function TicketOverview({
  ticket,
  fields = [],
  fieldNames = [],
  fallback = "Not available",
  enforcePermissions = true,
}) {
  const { hasPermission } = useAuth();

  const fieldMap = useMemo(
    () => new Map(fields.map((field) => [field.key, field])),
    [fields],
  );

  const allowedFields = useMemo(() => {
    const allowed = new Set(fieldNames);

    return new Set(
      fields
        .filter((field) => allowed.has(field.key))
        .filter((field) =>
          canReadField(field, enforcePermissions, hasPermission),
        )
        .map((field) => field.key),
    );
  }, [fields, fieldNames, enforcePermissions, hasPermission]);

  const groups = useMemo(() => {
    return TICKET_DETAIL_GROUPS.map((group) => {
      const groupFields = group.fields
        .map((key) => getDisplayField(key, fieldMap))
        .filter(Boolean)
        .filter(
          (field) =>
            TICKET_DETAIL_SYSTEM_FIELDS[field.key] ||
            allowedFields.has(field.key),
        );

      return {
        ...group,
        fields: groupFields,
      };
    }).filter((group) => group.fields.length > 0);
  }, [fieldMap, allowedFields]);

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
      }}
    >
      <DetailTable groups={groups} ticket={ticket} fallback={fallback} />
    </Box>
  );
}
