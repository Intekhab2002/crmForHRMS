export const SLA_STATUS = Object.freeze({
    NOT_TRACKED: "NOT_TRACKED",
    RUNNING: "RUNNING",
    PAUSED: "PAUSED",
    BREACHED: "BREACHED",
    COMPLETED: "COMPLETED",
    STOPPED: "STOPPED",
});

export const SLA_DEFAULTS = Object.freeze({
    PRIORITY: 100,
    TIMEZONE: "Asia/Kolkata",
    BUSINESS_HOURS_PER_DAY: 8,
    WORKDAY_START: "09:00",
    WORKDAY_END: "17:00",
    INCLUDE_SATURDAY: false,
    INCLUDE_SUNDAY: false,
    MAINTENANCE_INTERVAL_MS: 60_000,
});

export const SLA_FIELD_REGISTRY = Object.freeze({
    dependency_category: Object.freeze({
        column: "dependency_category_id",
        table: "ticket_dependency_categories",
        codeColumn: "code",
        nameColumn: "name",
    }),
    severity: Object.freeze({
        column: "severity_id",
        table: "ticket_severities",
        codeColumn: "code",
        nameColumn: "name",
    }),
    status: Object.freeze({
        column: "status_id",
        table: "ticket_statuses",
        codeColumn: "code",
        nameColumn: "name",
    }),
});

export const SLA_ERROR_CODES = Object.freeze({
    POLICY_NOT_FOUND: "SLA_POLICY_NOT_FOUND",
    CALENDAR_NOT_FOUND: "SLA_CALENDAR_NOT_FOUND",
    HOLIDAY_NOT_FOUND: "SLA_HOLIDAY_NOT_FOUND",
    TICKET_NOT_FOUND: "SLA_TICKET_NOT_FOUND",
    FIELD_NOT_SUPPORTED: "SLA_FIELD_NOT_SUPPORTED",
});

export default Object.freeze({
    SLA_STATUS,
    SLA_DEFAULTS,
    SLA_FIELD_REGISTRY,
    SLA_ERROR_CODES,
});
