import { ApiResponse } from "../../helpers/ApiResponse.js";
import logger from "../../config/logger.js";

import service from "./reports.service.js";
import { enqueueReportGeneration } from "./jobs/reportGeneration.job.js";
import storage from "./storage/reportStorage.js";

const pageMeta = (query, total) => {
  const totalPages = Math.ceil(total / query.limit);
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPreviousPage: query.page > 1,
  };
};

async function definitions(req, res, next) {
  try {
    return ApiResponse.success(
      res,
      await service.listDefinitions(),
      "Report definitions retrieved successfully.",
    );
  } catch (error) {
    next(error);
  }
}

async function definition(req, res, next) {
  try {
    return ApiResponse.success(
      res,
      await service.getDefinition(req.params.reportCode),
      "Report definition retrieved successfully.",
    );
  } catch (error) {
    next(error);
  }
}

async function preview(req, res, next) {
  try {
    const data = await service.preview(req.params.reportCode, req.body);
    logger.info("report_previewed", {
      reportCode: req.params.reportCode,
      userId: req.auth.userId,
      requestId: res.locals.requestId,
    });
    return ApiResponse.success(res, data, "Report preview generated successfully.");
  } catch (error) {
    next(error);
  }
}

async function generate(req, res, next) {
  try {
    const run = await service.createGenerationRun(
      req.params.reportCode,
      req.body,
      req.auth.userId,
    );

    enqueueReportGeneration(run.id);

    return ApiResponse.created(
      res,
      {
        id: run.id,
        reportId: run.report_id,
        status: run.status,
        reportCode: run.report_code,
      },
      "Report generation queued successfully.",
    );
  } catch (error) {
    next(error);
  }
}

async function runs(req, res, next) {
  try {
    const result = await service.listRuns(req.validatedQuery);
    return ApiResponse.paginated(
      res,
      result.rows,
      pageMeta(req.validatedQuery, result.total),
      "Report runs retrieved successfully.",
    );
  } catch (error) {
    next(error);
  }
}

async function run(req, res, next) {
  try {
    return ApiResponse.success(
      res,
      await service.getRun(req.params.runId),
      "Report run retrieved successfully.",
    );
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
    const artifact = await service.getArtifact(
      req.params.runId,
      req.params.artifactType,
    );

    const data = await storage.read(artifact.storage_key);

    logger.info("report_downloaded", {
      reportRunId: req.params.runId,
      artifactId: artifact.id,
      artifactType: artifact.artifact_type,
      userId: req.auth.userId,
      requestId: res.locals.requestId,
    });

    res.setHeader("Content-Type", artifact.mime_type);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${artifact.file_name.replaceAll('"', "")}"`,
    );
    res.setHeader("Content-Length", data.length);
    res.setHeader("X-Report-SHA256", artifact.sha256);
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export default Object.freeze({
  definitions,
  definition,
  preview,
  generate,
  runs,
  run,
  download,
});
