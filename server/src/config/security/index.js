/**
 * Centralized exports for the security configuration layer.
 */

export { default as helmetMiddleware } from "./helmet.config.js";

export {
  corsOptions,
  corsMiddleware,
} from "./cors.config.js";

export {
  compressionOptions,
  compressionFilter,
  createCompressionMiddleware,
} from "./compression.config.js";

export {
  jsonParserOptions,
  urlEncodedParserOptions,
  createJsonParser,
  createUrlEncodedParser,
} from "./parser.config.js";

export {
  cookieParserOptions,
  defaultCookieOptions,
  createDefaultCookieOptions,
  createCookieParserMiddleware,
} from "./cookie.config.js";

export {
  createHppMiddleware,
} from "./hpp.config.js";

export {
  sanitize,
  sanitizeDeep,
} from "./xss.config.js";

export { default as trustProxyConfig } from "./trusted.proxy.js";

export { default as securityHeadersPolicy } from "./security.headers.js";

export * from "./rateLimit.config.js";