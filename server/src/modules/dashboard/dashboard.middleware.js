/**
 * ============================================================================
 * CRM for HRMS
 * Dashboard Authorization Middleware
 * ============================================================================
 *
 * File:
 *     server/src/modules/dashboard/dashboard.middleware.js
 *
 * Purpose:
 *     Resolve the dashboard-specific RBAC permission from the validated
 *     dashboard route parameter and enforce it before controller execution.
 *
 * Responsibilities:
 *     - Validate that the requested dashboard type is configured.
 *     - Resolve the dashboard-specific permission from dashboard.constants.js.
 *     - Enforce the resolved permission through the existing RBAC service.
 *
 * This middleware does NOT:
 *     - Authenticate the request.
 *     - Parse JWTs.
 *     - Define dashboard permissions.
 *     - Perform SQL directly.
 *
 * Expected middleware order:
 *
 *     authenticate
 *          ↓
 *     validateDashboardType
 *          ↓
 *     authorizeDashboard
 *          ↓
 *     controller
 *
 * ============================================================================
 */

import AppError from "../../helpers/AppError.js";

import rbacService from "../rbac/rbac.service.js";

import {
    DASHBOARD_PERMISSION,
    DASHBOARD_TYPES,
} from "./dashboard.constants.js";

/**
 * Validate the dashboard route parameter.
 *
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {import("express").NextFunction} next
 *
 * @returns {void}
 */
function validateDashboardType(
    request,
    response,
    next,
) {
    try {
        const {
            dashboardType,
        } = request.params;

        if (
            typeof dashboardType !== "string" ||
            !DASHBOARD_TYPES.includes(
                dashboardType,
            )
        ) {
            return next(
                AppError.validation(
                    "Invalid dashboard type.",
                    {
                        dashboardType,
                    },
                ),
            );
        }

        return next();
    } catch (error) {
        return next(error);
    }
}

/**
 * Authorize the requested dashboard.
 *
 * The permission is resolved from the centralized dashboard permission map.
 * No dashboard-specific permission string is hard-coded here.
 *
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {import("express").NextFunction} next
 *
 * @returns {Promise<void>}
 */
async function authorizeDashboard(
    request,
    response,
    next,
) {
    try {
        const userId =
            request?.auth?.userId;

        if (
            typeof userId !== "string" ||
            userId.trim().length === 0
        ) {
            throw AppError.unauthorized(
                "Authentication is required.",
            );
        }

        const {
            dashboardType,
        } = request.params;

        const permission =
            DASHBOARD_PERMISSION[
                dashboardType
            ];

        if (
            typeof permission !== "string" ||
            permission.trim().length === 0
        ) {
            throw AppError.configuration(
                `No permission is configured for dashboard type: ${dashboardType}.`,
            );
        }

        await rbacService.requirePermission(
            userId,
            permission,
        );

        return next();
    } catch (error) {
        return next(error);
    }
}

const dashboardMiddleware = Object.freeze({
    validateDashboardType,
    authorizeDashboard,
});

export {
    validateDashboardType,
    authorizeDashboard,
};

export default dashboardMiddleware;