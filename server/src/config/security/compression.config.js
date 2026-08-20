/**
 * -----------------------------------------------------------------------------
 * File: compression.config.js
 * Path: src/config/security/compression.config.js
 * -----------------------------------------------------------------------------
 * Description:
 * Centralized response compression configuration.
 *
 * Responsibilities:
 * - Configure HTTP response compression
 * - Define enterprise compression filter
 * - Export reusable compression options
 * - Provide middleware factory
 *
 * -----------------------------------------------------------------------------
 */

import compression from "compression";

import appConfig from "../app.config.js";
import logger from "../logger.js";

/**
 * Enterprise compression filter.
 *
 * Compression is skipped when:
 * - Client explicitly disables compression.
 * - Response contains the x-no-compression header.
 *
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {boolean}
 */
function compressionFilter(request, response) {
  if (response.getHeader("x-no-compression")) {
    return false;
  }

  return compression.filter(request, response);
}

/**
 * Compression configuration.
 *
 * @type {import("compression").CompressionOptions}
 */
const compressionOptions = {
  level: appConfig.compression.level,
  threshold: appConfig.compression.threshold,
  filter: compressionFilter,
};

/**
 * Creates a configured compression middleware instance.
 *
 * @returns {import("express").RequestHandler}
 */
function createCompressionMiddleware() {
  logger.info("HTTP response compression initialized.", {
    level: compressionOptions.level,
    threshold: compressionOptions.threshold,
  });

  return compression(compressionOptions);
}

export {
  compressionFilter,
  compressionOptions,
  createCompressionMiddleware,
};

export default createCompressionMiddleware;