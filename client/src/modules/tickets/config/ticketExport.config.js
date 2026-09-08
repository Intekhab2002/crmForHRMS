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
  modes: Object.freeze({
    selected: Object.freeze({
      label: "Selected tickets",
      description: "Export only the tickets you selected.",
    }),

    filtered: Object.freeze({
      label: "Current filtered tickets",
      description:
        "Export all tickets matching the current search and filters.",
    }),

    all: Object.freeze({
      label: "All tickets",
      description: "Export every ticket available to you.",
    }),
  }),
});

export default TICKET_EXPORT_CONFIG;
