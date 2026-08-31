import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const requiredVariables = [
  "NODE_ENV",
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "COOKIE_SECRET",
  "CORS_ALLOWED_ORIGINS",
  "HOST",
];

const ALLOWED_NODE_ENVIRONMENTS = Object.freeze([
  "development",
  "production",
  "test",
]);

const parseNumber = (value, variableName) => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`${variableName} must be a valid number.`);
  }

  return parsed;
};

const parseOptionalNumber = (value, variableName, defaultValue) => {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  return parseNumber(value, variableName);
};

const validateRequiredVariables = (variables) => {
  variables.forEach((variable) => {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  });
};

validateRequiredVariables(requiredVariables);

if (!ALLOWED_NODE_ENVIRONMENTS.includes(process.env.NODE_ENV)) {
  throw new Error(
    `Invalid NODE_ENV: ${process.env.NODE_ENV}. Allowed values: ${ALLOWED_NODE_ENVIRONMENTS.join(", ")}`,
  );
}

const env = Object.freeze({
  app: Object.freeze({
    name: process.env.APP_NAME,

    version: process.env.APP_VERSION,

    environment: process.env.NODE_ENV,
  }),

  cookies: Object.freeze({
    secret: process.env.COOKIE_SECRET,

    secure: process.env.COOKIE_SECURE === "true",

    sameSite: process.env.COOKIE_SAMESITE,
  }),

  server: Object.freeze({
    host: process.env.HOST,
    port: parseNumber(process.env.PORT, "PORT"),
    trustProxy: process.env.TRUST_PROXY === "true"
            ? true
            : process.env.TRUST_PROXY === "false"
              ? false
              : Number.isInteger(Number(process.env.TRUST_PROXY))
                ? Number(process.env.TRUST_PROXY)
                : process.env.TRUST_PROXY,
  }),

  database: Object.freeze({
    host: process.env.DB_HOST,

    port: parseNumber(process.env.DB_PORT, "DB_PORT"),

    database: process.env.DB_NAME,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    // maxConnections: parseNumber(process.env.DB_MAX_CONNECTIONS, "DB_MAX_CONNECTIONS"),
    maxConnections: parseOptionalNumber(
      process.env.DB_MAX_CONNECTIONS,
      "DB_MAX_CONNECTIONS",
      20,
    ),

    idleTimeout: parseOptionalNumber(
      process.env.DB_IDLE_TIMEOUT,
      "DB_IDLE_TIMEOUT",
      30000,
    ),

    connectionTimeout: parseOptionalNumber(
      process.env.DB_CONNECTION_TIMEOUT,
      "DB_CONNECTION_TIMEOUT",
      30000,
    ),

    dbSlowQueryThreshold: parseOptionalNumber(
      process.env.DB_SLOW_QUERY_THRESHOLD,
      "DB_SLOW_QUERY_THRESHOLD",
      2000,
    ),
    connectionRetries: parseOptionalNumber(
      process.env.DB_CONNECTION_RETRIES,
      "DB_CONNECTION_RETRIES",
      5,
    ),
    connectionRetryDelay: parseOptionalNumber(
      process.env.DB_CONNECTION_RETRY_DELAY,
      "DB_CONNECTION_RETRY_DELAY",
      1000,
    ),
  }),

  jwt: Object.freeze({
    secret: process.env.JWT_SECRET,

    expiresIn: process.env.JWT_EXPIRES_IN,

    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  }),

  logging: Object.freeze({
    level: process.env.LOG_LEVEL,
    maxSize: process.env.LOG_MAX_SIZE,
    maxFiles: process.env.LOG_MAX_FILES,
    zippedArchive: process.env.LOG_ZIPPED_ARCHIVE === "true",
    logDirectory: process.env.LOG_DIRECTORY,
  }),

  security: Object.freeze({
    /**
     * Password Security
     */
    bcryptSaltRounds: parseNumber(
      process.env.BCRYPT_SALT_ROUNDS,
      "BCRYPT_SALT_ROUNDS",
    ),

    /**
     * Rate Limiting
     */
    rateLimitWindow: parseNumber(
      process.env.RATE_LIMIT_WINDOW,
      "RATE_LIMIT_WINDOW",
    ),

    rateLimitMaxRequests: parseNumber(
      process.env.RATE_LIMIT_MAX_REQUESTS,
      "RATE_LIMIT_MAX_REQUESTS",
    ),

    rateLimitAuthWindow: parseNumber(
      process.env.RATE_LIMIT_AUTH_WINDOW,
      "RATE_LIMIT_AUTH_WINDOW",
    ),

    rateLimitAuthMaxRequests: parseNumber(
      process.env.RATE_LIMIT_AUTH_MAX_REQUESTS,
      "RATE_LIMIT_AUTH_MAX_REQUESTS",
    ),
  }),

  compression: Object.freeze({
    threshold: process.env.COMPRESSION_THRESHOLD ?? "1kb",
  }),

  features: Object.freeze({
    swagger: process.env.ENABLE_SWAGGER === "true",

    requestLogging: process.env.ENABLE_REQUEST_LOGGING === "true",
  }),
  http: Object.freeze({
    jsonLimit: process.env.JSON_LIMIT ?? "1mb",

    urlEncodedLimit: process.env.URLENCODED_LIMIT ?? "1mb",

    corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),

    corsCredentials: process.env.CORS_CREDENTIALS === "true",

    parameterLimit: parseNumber(process.env.PARAMETER_LIMIT, "PARAMETER_LIMIT"),
    apiPrefix: process.env.API_PREFIX,
    apiVersion: process.env.API_VERSION,
  }),

seeding: Object.freeze({
    developerUsername:
        process.env.SEED_DEVELOPER_USERNAME,

    developerEmail:
        process.env.SEED_DEVELOPER_EMAIL,

    developerPassword:
        process.env.SEED_DEVELOPER_PASSWORD,
}),
  ssl: Object.freeze({
    
    dbSsl: process.env.DB_SSL,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED,
    dbSslCA: process.env.DB_SSL_CA
  })
});

export default env;
