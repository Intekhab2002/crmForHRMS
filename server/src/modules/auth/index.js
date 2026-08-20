/**
 * ============================================================================
 * Authentication Module
 * ============================================================================
 *
 * Public entry point for the authentication module.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Expose the authentication router.
 * • Keep module-internal implementation details encapsulated.
 *
 * The application route registry should import this module instead of
 * reaching into individual authentication implementation files.
 *
 * ============================================================================
 */

import authRoutes from "./auth.routes.js";

const authModule = Object.freeze({
    routes: authRoutes,
});

export default authModule;