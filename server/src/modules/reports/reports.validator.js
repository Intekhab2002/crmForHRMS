import { z } from "zod";

import {
  REPORT_PERIOD,
  REPORT_STATUS,
} from "./reports.constants.js";

const uuid = z.string().uuid();

const dateTime = z.string().datetime({ offset: true });

export const previewSchema = z.object({
  period: z.enum(Object.values(REPORT_PERIOD)),
  periodStart: dateTime.optional(),
  periodEnd: dateTime.optional(),
  dataCutoff: dateTime.optional(),
  timezone: z.string().min(1).max(100).optional(),
  policyIds: z.array(uuid).max(100).optional().default([]),
  severityKeys: z.array(z.string().trim().min(1).max(100)).max(100).optional().default([]),
  statuses: z.array(z.string().trim().min(1).max(30)).max(20).optional().default([]),
});

export const generateSchema = previewSchema;

export const listRunsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  reportCode: z.string().trim().max(100).optional(),
  status: z.enum(Object.values(REPORT_STATUS)).optional(),
});

export const reportCodeParamSchema = z.object({
  reportCode: z.string().trim().min(1).max(100),
});

export const runIdParamSchema = z.object({
  runId: uuid,
});

export const artifactParamSchema = z.object({
  runId: uuid,
  artifactType: z.enum(["pdf", "xlsx"]),
});

export default Object.freeze({
  previewSchema,
  generateSchema,
  listRunsSchema,
  reportCodeParamSchema,
  runIdParamSchema,
  artifactParamSchema,
});
