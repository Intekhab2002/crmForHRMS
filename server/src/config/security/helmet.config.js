/**
 * -----------------------------------------------------------------------------
 * File: helmet.config.js
 * Path: src/config/security/helmet.config.js
 * -----------------------------------------------------------------------------
 * Description:
 * Creates and exports the application's Helmet middleware using the centralized
 * security header policy.
 *
 * Responsibilities:
 * - Consume application security policy
 * - Build Helmet middleware
 * - Apply environment-aware configuration
 * - Export a ready-to-use middleware instance
 *
 * -----------------------------------------------------------------------------
 */

import helmet from "helmet";

import appConfig from "../app.config.js";
import logger from "../logger.js";
import securityHeadersPolicy from "./security.headers.js";
import { APP_CONSTANTS } from "../../constants/app.constants.js";


/**
 * Builds Helmet configuration.
 *
 * @returns {import("helmet").HelmetOptions}
 */
function createHelmetOptions() {
const isProduction =
  appConfig.app.environment === APP_CONSTANTS.PRODUCTION;
  return{
    /**
     * Content Security Policy
     *
     * Disabled by default until frontend domains, CDN,
     * fonts and third-party integrations are finalized.
     */
    contentSecurityPolicy: false,

    /**
     * Cross-Origin policies
     */
    crossOriginEmbedderPolicy:
      securityHeadersPolicy.crossOriginEmbedderPolicy,

    crossOriginOpenerPolicy:
      securityHeadersPolicy.crossOriginOpenerPolicy,

    crossOriginResourcePolicy:
      securityHeadersPolicy.crossOriginResourcePolicy,

    /**
     * Clickjacking protection
     */
    frameguard: securityHeadersPolicy.frameguard,

    /**
     * MIME Sniffing protection
     */
    noSniff: securityHeadersPolicy.noSniff,

    /**
     * Referrer Policy
     */
    referrerPolicy: securityHeadersPolicy.referrerPolicy,

    /**
     * DNS Prefetch
     */
    dnsPrefetchControl:
      securityHeadersPolicy.dnsPrefetchControl,

    /**
     * Hide Express signature
     */
    hidePoweredBy:
      securityHeadersPolicy.hidePoweredBy,

    /**
     * Legacy XSS protection
     */
    // xssFilter: securityHeadersPolicy.xssFilter,

    /**
     * HTTPS enforcement
     *
     * Enabled only in production.
     */
    hsts: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  };
}

const helmetOptions = createHelmetOptions();

/**
 * Helmet middleware instance.
 */
const helmetMiddleware = helmet(helmetOptions);

logger.info("Helmet security middleware initialized.", {
  hsts: Boolean(helmetOptions.hsts),
  csp: Boolean(helmetOptions.contentSecurityPolicy),
  environment: appConfig.app.environment,
});

export { helmetOptions, helmetMiddleware };

export default helmetMiddleware;