import { PERMISSIONS } from "../../../config/permission.config";

export const TICKET_EXPORT_CONFIG = Object.freeze({
  permission: PERMISSIONS.TICKET_READ,
  title: "Export Tickets",
  description:
    "Download ticket records created within the selected date range.",
  fromDateLabel: "From date",
  toDateLabel: "To date",
  helperText: "Dates are based on ticket Created At and are inclusive.",
  cancelLabel: "Cancel",
  submitLabel: "Export Tickets",
  submittingLabel: "Preparing download...",
  presets: Object.freeze([
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "last7Days", label: "Last 7 days" },
    { key: "thisMonth", label: "This month" },
    { key: "previousMonth", label: "Previous month" },
  ]),
});

export default TICKET_EXPORT_CONFIG;
