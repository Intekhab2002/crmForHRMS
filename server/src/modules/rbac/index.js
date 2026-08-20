/**
 * ============================================================================
 * CRM for HRMS
 * RBAC Module
 * ============================================================================
 *
 * File:
 *     src/modules/rbac/index.js
 *
 * Purpose:
 *     Public entry point for the RBAC module.
 *
 * Internal RBAC implementation details should not be imported directly by
 * unrelated application modules where the module API is sufficient.
 * ============================================================================
 */

import rbacConstants from "./rbac.constants.js";
import rbacRepository from "./rbac.repository.js";
import rbacService from "./rbac.service.js";
import rbacMiddleware from "./rbac.middleware.js";

const rbacModule = Object.freeze({
    constants: rbacConstants,
    repository: rbacRepository,
    service: rbacService,
    middleware: rbacMiddleware,
});

export default rbacModule;