/**
 * -----------------------------------------------------------------------------
 * File: cookie.config.js
 * Path: src/config/security/cookie.config.js
 * -----------------------------------------------------------------------------
 * Description:
 * Centralized Cookie Parser configuration.
 *
 * Responsibilities:
 * - Configure cookie parsing
 * - Support signed cookies
 * - Export middleware factory
 * - Provide a single source of truth for cookie parsing
 *
 * -----------------------------------------------------------------------------
 */

import cookieParser from "cookie-parser";

import appConfig from "../app.config.js";
import logger from "../logger.js";
import { APP_CONSTANTS } from "../../constants/app.constants.js";

/**
 * Cookie Parser configuration.
 *
 * Contains configuration required for parsing and verifying
 * signed cookies. Cookie issuance policies are defined
 * separately through cookie option factories.
 */
const cookieParserOptions = {
  secret: appConfig.cookies.secret,
};


function createDefaultCookieOptions() {
    return {
        httpOnly: true,
        secure: appConfig.app.environment === APP_CONSTANTS.PRODUCTION,
        sameSite: "strict",
        path: "/",
    };
}

/**
 * Creates the Cookie Parser middleware.
 *
 * @returns {import("express").RequestHandler}
 */
function createCookieParserMiddleware() {
  logger.info("Cookie parser middleware initialized.", {
    signedCookies: Boolean(cookieParserOptions.secret),
  });

  return cookieParser(cookieParserOptions.secret);
}

const defaultCookieOptions = Object.freeze(
    createDefaultCookieOptions()
);

export {
    cookieParserOptions,
    defaultCookieOptions,
    createDefaultCookieOptions,
    createCookieParserMiddleware,
};