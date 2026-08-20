import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import config from "./app.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDirectory = path.join(__dirname, "../logs");

const logFolders = [
  "combined",
  "error",
  "http",
  "exceptions",
  "rejections",
];

if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory);
}

logFolders.forEach((folder) => {
  const folderPath = path.join(logsDirectory, folder);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
  },

  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    verbose: "cyan",
    debug: "blue",
  },
};

winston.addColors(customLevels.colors);

const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.metadata({
        fillExcept: ["message", "level", "timestamp", "label"],
    }),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),

  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),

  winston.format.printf(
    ({ timestamp, level, message, stack }) => {
      return `${timestamp} ${level}: ${stack || message}`;
    }
  )
);

const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),

  new DailyRotateFile({
    dirname: path.join(logsDirectory, "combined"),

    filename: "%DATE%.log",

    datePattern: "YYYY-MM-DD",

    maxSize: config.logging.LOG_MAX_SIZE,

    maxFiles: config.logging.LOG_MAX_FILES,

    zippedArchive:
      config.logging.LOG_ZIPPED_ARCHIVE === "true",

    level: config.logging.level,

    format: jsonFormat,
  }),

  new DailyRotateFile({
    dirname: path.join(logsDirectory, "error"),

    filename: "%DATE%.log",

    datePattern: "YYYY-MM-DD",

    level: "error",

    maxSize: config.logging.LOG_MAX_SIZE,

    maxFiles: config.logging.LOG_MAX_FILES,

    zippedArchive:
      config.logging.LOG_ZIPPED_ARCHIVE === "true",

    format: jsonFormat,
  }),

  new DailyRotateFile({
    dirname: path.join(logsDirectory, "http"),

    filename: "%DATE%.log",

    datePattern: "YYYY-MM-DD",

    level: "http",

    maxSize: config.logging.LOG_MAX_SIZE,

    maxFiles: config.logging.LOG_MAX_FILES,

    zippedArchive:
      config.logging.LOG_ZIPPED_ARCHIVE === "true",

    format: jsonFormat,
  }),
];

const logger = winston.createLogger({
  levels: customLevels.levels,

  level: config.logging.level,

  transports,

  exitOnError: false,

  exceptionHandlers: [
    new DailyRotateFile({
      dirname: path.join(logsDirectory, "exceptions"),

      filename: "%DATE%.log",

      datePattern: "YYYY-MM-DD",

      format: jsonFormat,
    }),
  ],

  rejectionHandlers: [
    new DailyRotateFile({
      dirname: path.join(logsDirectory, "rejections"),

      filename: "%DATE%.log",

      datePattern: "YYYY-MM-DD",

      format: jsonFormat,
    }),
  ],
});

logger.stream = {
    write(message) {
        logger.http(message.trim());
    },
};

export default logger;