/**
 * ============================================================================
 * File: publicPortal.config.js
 * Path: src/config/publicPortal.config.js
 * ============================================================================
 */

const PUBLIC_TICKET_RESULT_FIELDS = Object.freeze([
  {
    key: "ticketNumber",
    label: "Ticket Number",
    type: "reference",
  },
  {
    key: "createdDate",
    label: "Created On",
    type: "dateTime",
  },
  {
    key: "statusName",
    label: "Current Status",
    type: "status",
  },
  {
    key: "lastUpdated",
    label: "Last Updated",
    type: "dateTime",
  },
]);

export const PUBLIC_PORTAL_CONFIG = Object.freeze({
  branding: Object.freeze({
    title: "HRMS Grievance Redressal",
    subtitle:
      "Government of Bihar",
    description:
      "Submit and track your grievance with the HRMS Grievance Redressal System.",
  }),

  entry: Object.freeze({
    login: Object.freeze({
      title: "Department Login",
      description:
        "Authorized department personnel can sign in to manage grievances, tickets, and related activities.",
      actionLabel: "Department Login",
      path: "/login",
    }),

    ticketStatus: Object.freeze({
      title: "Track Your Ticket",
      description:
        "Check the current status of your grievance using your ticket details.",
      actionLabel: "Track Ticket Status",
      path: "/ticket-status",
    }),
  }),

  ticketStatus: Object.freeze({
    title: "Track Ticket Status",

    description:
      "Enter the ticket creation date and at least one additional detail to check the current status of your ticket.",

    form: Object.freeze({
      createdDateLabel: "Ticket Created Date",
      ticketNumberLabel: "Ticket Number",
      mobileNumberLabel: "Mobile Number",
      emailIdLabel: "Email ID",

      ticketNumberPlaceholder:
        "e.g. TKT-2026-000123 or 000123",

      mobileNumberPlaceholder:
        "Enter registered mobile number",

      emailIdPlaceholder:
        "Enter registered email address",

      submitLabel: "Check Ticket Status",
      resetLabel: "Clear",

      helperText:
        "Ticket created date is required. Provide at least one of ticket number, mobile number, or email ID.",
    }),

    results: Object.freeze({
      title: "Ticket Status",
      countLabel: "ticket(s) found",
      emptyTitle: "No Ticket Found",
      emptyMessage:
        "We could not find a ticket matching the information provided.",

      fields: PUBLIC_TICKET_RESULT_FIELDS,
    }),

    messages: Object.freeze({
      searchFailed:
        "Unable to check ticket status at the moment. Please try again later.",
    }),
  }),
});

export {
  PUBLIC_TICKET_RESULT_FIELDS,
};

export default PUBLIC_PORTAL_CONFIG;