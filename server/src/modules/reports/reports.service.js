import { DateTime } from "luxon";
import crypto from "node:crypto";

import AppError from "../../helpers/AppError.js";
import logger from "../../config/logger.js";

import repository from "./reports.repository.js";
import reportsConfig from "./reports.config.js";
import { slaComplianceDefinition } from "./definitions/slaCompliance.definition.js";
import { fetchComplianceDataset } from "./queries/slaCompliance.query.js";
import { fetchSeverityPerformance } from "./queries/slaSeverity.query.js";
import { fetchSegments } from "./queries/slaAuditEvidence.query.js";
import { buildPolicyPerformance } from "./queries/slaPolicy.query.js";
import { buildBreachAnalysis } from "./queries/slaBreach.query.js";
import { buildExceptions } from "./queries/slaException.query.js";
import { buildMonthlyTrend } from "./queries/slaTrend.query.js";
import { calculateCompliance } from "./calculators/slaCompliance.calculator.js";
import { calculateMetrics } from "./calculators/slaMetrics.calculator.js";
import { reconcile } from "./calculators/reconciliation.calculator.js";
import { generateReportPdf } from "./generators/pdf/reportPdf.generator.js";
import { generateReportExcel } from "./generators/excel/reportExcel.generator.js";
import storage from "./storage/reportStorage.js";

const DEFINITIONS = new Map([
  [slaComplianceDefinition.code, slaComplianceDefinition],
]);

function resolvePeriod(input) {
  const timezone = input.timezone || reportsConfig.timezone;
  const now = DateTime.now().setZone(timezone);

  if (input.period === "CURRENT_MONTH") {
    const start = now.startOf("month");
    const end = start.plus({ months: 1 });
    return {
      timezone,
      periodStart: start.toUTC().toISO(),
      periodEnd: end.toUTC().toISO(),
      dataCutoff: DateTime.min(now, end).toUTC().toISO(),
    };
  }

  if (input.period === "PREVIOUS_MONTH") {
    const end = now.startOf("month");
    const start = end.minus({ months: 1 });
    return {
      timezone,
      periodStart: start.toUTC().toISO(),
      periodEnd: end.toUTC().toISO(),
      dataCutoff: end.toUTC().toISO(),
    };
  }

  if (!input.periodStart || !input.periodEnd) {
    throw AppError.validation("Custom reporting period requires periodStart and periodEnd.");
  }

  const start = DateTime.fromISO(input.periodStart, { setZone: true });
  const end = DateTime.fromISO(input.periodEnd, { setZone: true });

  if (!start.isValid || !end.isValid || end <= start) {
    throw AppError.validation("Reporting period is invalid.");
  }

  const cutoff = input.dataCutoff
    ? DateTime.fromISO(input.dataCutoff, { setZone: true })
    : end;

  if (!cutoff.isValid || cutoff < end) {
    throw AppError.validation("dataCutoff must be on or after periodEnd.");
  }

  return {
    timezone,
    periodStart: start.toUTC().toISO(),
    periodEnd: end.toUTC().toISO(),
    dataCutoff: cutoff.toUTC().toISO(),
  };
}

function resolveDefinition(code) {
  const definition = DEFINITIONS.get(code);
  if (!definition) {
    throw AppError.notFound(`Report definition '${code}' was not found.`);
  }
  return definition;
}

function normalizeInput(input) {
  const period = resolvePeriod(input);
  return {
    ...input,
    ...period,
    policyIds: input.policyIds || [],
    severityKeys: input.severityKeys || [],
    statuses: input.statuses || [],
  };
}

async function buildDataset(input) {
  const runs = await fetchComplianceDataset(input);

  let filteredRuns = runs;

  if (input.severityKeys?.length) {
    const segments = await fetchSegments(runs);
    const allowed = new Set(
      segments
        .filter((segment) => input.severityKeys.includes(segment.duration_value_key))
        .map((segment) => `${segment.ticket_id}:${segment.run_number}`),
    );

    filteredRuns = runs.filter((run) =>
      allowed.has(`${run.ticket_id}:${run.run_number}`),
    );
  }

  const segments = await fetchSegments(filteredRuns);
  const compliance = calculateCompliance(filteredRuns);
  const metrics = calculateMetrics(filteredRuns);
  const policyPerformance = buildPolicyPerformance(filteredRuns);
  const severityPerformance = await fetchSeverityPerformance(filteredRuns);
  const breachAnalysis = buildBreachAnalysis(filteredRuns);
  const exceptions = buildExceptions(filteredRuns, segments);
  const trend = buildMonthlyTrend(filteredRuns, input.timezone);
  const reconciliation = reconcile({
    runs: filteredRuns,
    compliance,
    exceptions,
    segments,
  });

  return {
    runs: filteredRuns,
    segments,
    compliance,
    metrics,
    policyPerformance,
    severityPerformance,
    breachAnalysis,
    exceptions,
    trend,
    reconciliation,
    scope: {
      ticketCount: new Set(filteredRuns.map((run) => run.ticket_id)).size,
    },
  };
}

export async function preview(code, input) {
  const definition = resolveDefinition(code);
  const normalized = normalizeInput(input);
  const dataset = await buildDataset(normalized);

  return {
    reportCode: definition.code,
    reportName: definition.name,
    reportVersion: definition.version,
    calculationVersion: definition.calculationVersion,
    reportingPeriod: {
      start: normalized.periodStart,
      end: normalized.periodEnd,
    },
    dataCutoff: normalized.dataCutoff,
    timezone: normalized.timezone,
    recordCount: dataset.runs.length,
    ...dataset.compliance,
    compliance: dataset.compliance.complianceRate,
    reconciliation: dataset.reconciliation.status,
    exceptions: dataset.exceptions.length,
    exceptionBreakdown: dataset.exceptions.reduce((acc, row) => {
      acc[row.code] = (acc[row.code] || 0) + 1;
      return acc;
    }, {}),
  };
}

export async function createGenerationRun(code, input, userId) {
  const definition = resolveDefinition(code);
  const normalized = normalizeInput(input);

  const reportNumber = await repository.nextReportNumber();
  const periodMonth = DateTime.fromISO(normalized.periodStart, { setZone: true })
    .setZone(normalized.timezone)
    .toFormat("yyyy-MM");

  const reportId = `SLA-RPT-${periodMonth}-${String(reportNumber).padStart(6, "0")}`;

  const persistedDefinition = await repository.findDefinition(definition.code);
  if (!persistedDefinition) {
    throw AppError.conflict("Report definition is not registered in the database.", {
      code: "REPORT_DEFINITION_NOT_REGISTERED",
    });
  }

  const run = await repository.createRun({
    reportId,
    definitionId: persistedDefinition.id,
    reportCode: definition.code,
    reportVersion: definition.version,
    calculationVersion: definition.calculationVersion,
    periodStart: normalized.periodStart,
    periodEnd: normalized.periodEnd,
    dataCutoff: normalized.dataCutoff,
    timezone: normalized.timezone,
    filters: {
      policyIds: normalized.policyIds,
      severityKeys: normalized.severityKeys,
      statuses: normalized.statuses,
    },
    parameters: {
      period: normalized.period,
      definitionConfiguration: {
        methodology: definition.methodology,
        filters: definition.filters,
      },
    },
    requestedByUserId: userId,
  });

  logger.info("report_requested", {
    reportCode: definition.code,
    reportRunId: run.id,
    reportId: run.report_id,
    userId,
  });

  return run;
}

export async function processRun(runId) {
  const claimed = await repository.claimRun(runId);
  if (!claimed) return null;

  const startedAt = Date.now();
  const createdArtifacts = [];

  try {
    const definition = resolveDefinition(claimed.report_code);
    const filters = claimed.filters || {};
    const dataset = await buildDataset({
      periodStart: claimed.period_start,
      periodEnd: claimed.period_end,
      dataCutoff: claimed.data_cutoff,
      timezone: claimed.timezone,
      policyIds: filters.policyIds || [],
      severityKeys: filters.severityKeys || [],
      statuses: filters.statuses || [],
    });

    if (dataset.runs.length > reportsConfig.maxGenerationRows) {
      throw AppError.badRequest(
        `Report contains ${dataset.runs.length} SLA runs, exceeding the configured generation limit of ${reportsConfig.maxGenerationRows}.`,
        { code: "REPORT_ROW_LIMIT_EXCEEDED" },
      );
    }

    if (dataset.reconciliation.status !== "PASS") {
      throw AppError.conflict(
        "Report reconciliation failed. The report cannot be finalized.",
        { code: "REPORT_RECONCILIATION_FAILED" },
      );
    }

    const generatedAt = new Date();
    const reportData = {
      ...dataset,
      documentControl: {
        reportId: claimed.report_id,
        reportType: definition.name,
        reportVersion: definition.version,
        calculationVersion: definition.calculationVersion,
        periodStart: claimed.period_start,
        periodEnd: claimed.period_end,
        dataCutoff: claimed.data_cutoff,
        generatedAt: generatedAt.toISOString(),
        generatedByUserId: claimed.requested_by_user_id,
        timezone: claimed.timezone,
        status: "FINAL",
        recordCount: dataset.runs.length,
      },
      company: reportsConfig.company,
    };

    const pdfBuffer = await generateReportPdf(reportData);
    const excelBuffer = await generateReportExcel(reportData);

    const artifacts = [];
    for (const artifact of [
      {
        type: "PDF",
        extension: "pdf",
        mime: "application/pdf",
        buffer: pdfBuffer,
      },
      {
        type: "XLSX",
        extension: "xlsx",
        mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: excelBuffer,
      },
    ]) {
      const fileName = `${claimed.report_id}.${artifact.extension}`;
      const stored = await storage.write({
        reportId: claimed.report_id,
        fileName,
        buffer: artifact.buffer,
      });

      const sha256 = crypto
        .createHash("sha256")
        .update(artifact.buffer)
        .digest("hex");

      const artifactRecord = await repository.createArtifact({
        reportRunId: claimed.id,
        artifactType: artifact.type,
        fileName,
        mimeType: artifact.mime,
        storageKey: stored.storageKey,
        fileSizeBytes: artifact.buffer.length,
        sha256,
      });

      artifacts.push(artifactRecord);
      createdArtifacts.push({
        id: artifactRecord.id,
        storageKey: artifactRecord.storage_key,
      });
    }

    const completed = await repository.completeRun(claimed.id, {
      recordCount: dataset.runs.length,
      generatedByUserId: claimed.requested_by_user_id,
    });

    logger.info("report_generated", {
      reportCode: claimed.report_code,
      reportRunId: claimed.id,
      reportId: claimed.report_id,
      recordCount: dataset.runs.length,
      durationMs: Date.now() - startedAt,
      artifactSize: pdfBuffer.length + excelBuffer.length,
    });

    return { ...completed, artifacts };
  } catch (error) {
    const errorCode = error.code || "REPORT_GENERATION_FAILED";
    const safeMessage = error.isOperational
      ? error.message
      : "Unable to generate report artifact.";

    await Promise.all(
      createdArtifacts.map(async (artifact) => {
        try {
          await storage.remove(artifact.storageKey);
        } catch (cleanupError) {
          logger.warn("report_artifact_cleanup_failed", {
            reportRunId: claimed.id,
            artifactId: artifact.id,
            error: cleanupError.message,
          });
        }
        await repository.deleteArtifact(artifact.id);
      }),
    );

    await repository.failRun(claimed.id, {
      errorCode,
      errorMessage: safeMessage,
    });

    logger.error("report_failed", {
      reportCode: claimed.report_code,
      reportRunId: claimed.id,
      reportId: claimed.report_id,
      errorCode,
      error: error.message,
      stack: error.stack,
      durationMs: Date.now() - startedAt,
    });

    throw error;
  }
}

export async function listRuns(input) {
  return repository.listRuns(input);
}

export async function getRun(runId) {
  const run = await repository.getRunWithArtifacts(runId);
  if (!run) throw AppError.notFound("Report run not found.");
  return run;
}

export async function getArtifact(runId, artifactType) {
  const artifact = await repository.findArtifact(runId, artifactType.toUpperCase());
  if (!artifact) throw AppError.notFound("Report artifact not found.");
  return artifact;
}

export async function listDefinitions() {
  return repository.listDefinitions();
}

export async function getDefinition(code) {
  const definition = await repository.findDefinition(code);
  if (!definition) {
    throw AppError.notFound(`Report definition '${code}' was not found.`);
  }
  return definition;
}

export default Object.freeze({
  preview,
  createGenerationRun,
  processRun,
  listRuns,
  getDefinition,
  getRun,
  getArtifact,
  listDefinitions,
  getDefinition,
});
