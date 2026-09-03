import { API_CONFIG } from "../../config/api.config";

export const OPTION_CONFIG = Object.freeze([
    Object.freeze({
        key: "serviceTypes",
        label: "Service Types",
        singularLabel: "Service Type",
        endpoint:
            API_CONFIG.endpoints.options.serviceTypes,
    }),

    Object.freeze({
        key: "districts",
        label: "Districts",
        singularLabel: "District",
        endpoint:
            API_CONFIG.endpoints.options.districts,
    }),

    Object.freeze({
        key: "departments",
        label: "Departments",
        singularLabel: "Department",
        endpoint:
            API_CONFIG.endpoints.options.departments,
    }),

    Object.freeze({
        key: "ticketCategories",
        label: "Ticket Categories",
        singularLabel: "Ticket Category",
        endpoint:
            API_CONFIG.endpoints.options.ticketCategories,
    }),

    Object.freeze({
        key: "problemStatements",
        label: "Problem Statements",
        singularLabel: "Problem Statement",
        endpoint:
            API_CONFIG.endpoints.options.problemStatements,
    }),

    Object.freeze({
        key: "currentBillStatuses",
        label: "Current Bill Statuses",
        singularLabel: "Current Bill Status",
        endpoint:
            API_CONFIG.endpoints.options.currentBillStatuses,
    }),

    Object.freeze({
        key: "ticketStatuses",
        label: "Ticket Statuses",
        singularLabel: "Ticket Status",
        endpoint:
            API_CONFIG.endpoints.options.ticketStatuses,
    }),

    Object.freeze({
        key: "ticketSeverities",
        label: "Ticket Severities",
        singularLabel: "Ticket Severity",
        endpoint:
            API_CONFIG.endpoints.options.ticketSeverities,
    }),

    Object.freeze({
        key: "ticketIssueCategories",
        label: "Ticket Issue Categories",
        singularLabel: "Ticket Issue Category",
        endpoint:
            API_CONFIG.endpoints.options
                .ticketIssueCategories,
    }),

    Object.freeze({
        key: "ticketDependencyCategories",
        label: "Ticket Dependency Categories",
        singularLabel: "Ticket Dependency Category",
        endpoint:
            API_CONFIG.endpoints.options
                .ticketDependencyCategories,
    }),
]);

export function getOptionConfig(key) {
    return (
        OPTION_CONFIG.find(
            (option) => option.key === key,
        ) ?? null
    );
}