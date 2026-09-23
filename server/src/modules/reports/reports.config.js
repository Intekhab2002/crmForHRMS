import path from "node:path";

import {
  CALCULATION_VERSION,
  REPORT_CODE,
  REPORT_VERSION,
} from "./reports.constants.js";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const reportsConfig = Object.freeze({
  timezone: process.env.REPORT_DEFAULT_TIMEZONE || "Asia/Kolkata",
  storageRoot: path.resolve(
    process.env.REPORT_STORAGE_PATH || path.join(process.cwd(), "storage", "reports"),
  ),
  workerPollMs: parsePositiveInt(process.env.REPORT_WORKER_POLL_MS, 2000),
  historyDefaultLimit: parsePositiveInt(process.env.REPORT_HISTORY_DEFAULT_LIMIT, 20),
  historyMaxLimit: parsePositiveInt(process.env.REPORT_HISTORY_MAX_LIMIT, 100),
  maxGenerationRows: parsePositiveInt(process.env.REPORT_MAX_GENERATION_ROWS, 250000),
  company: Object.freeze({
    name: process.env.REPORT_COMPANY_NAME || "CRM for HRMS",
    address: process.env.REPORT_COMPANY_ADDRESS || "",
    contact: process.env.REPORT_COMPANY_CONTACT || "",
    classification:
      process.env.REPORT_CLASSIFICATION || "Confidential — Internal Use",
    footer: process.env.REPORT_FOOTER || "CRM for HRMS",
  }),
  definitions: Object.freeze({
    [REPORT_CODE.SLA_COMPLIANCE]: Object.freeze({
      code: REPORT_CODE.SLA_COMPLIANCE,
      name: "SLA Compliance & Performance",
      version: REPORT_VERSION,
      calculationVersion: CALCULATION_VERSION,
      supportsPdf: true,
      supportsExcel: true,
      filters: Object.freeze(["period", "policy", "severity", "status"]),
    }),
  }),
});

export default reportsConfig;
