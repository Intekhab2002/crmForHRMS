import { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { AuthContext } from "../../../context/AuthContextValue";
import { PERMISSIONS } from "../../../config/permission.config";
import slaApi from "../../sla/services/sla.api";

import ReportTypeSelector from "../components/ReportTypeSelector";
import ReportPeriodSelector from "../components/ReportPeriodSelector";
import ReportFilterPanel from "../components/ReportFilterPanel";
import ReportPreview from "../components/ReportPreview";
import ReportStatus from "../components/ReportStatus";
import ReportHistoryGrid from "../components/ReportHistoryGrid";
import ReportRunDetails from "../components/ReportRunDetails";

import { useReportDefinitions } from "../hooks/useReportDefinitions";
import { useReportPreview } from "../hooks/useReportPreview";
import { useReportGeneration } from "../hooks/useReportGeneration";
import { useReportRuns } from "../hooks/useReportRuns";
import reportsApi from "../services/reports.api";
import { REPORT_CONFIG } from "../config/reports.config";
import { buildReportPayload } from "../utils/reportQueryParams";
import { createDownload } from "../utils/reportFormatters";

const initialPeriod = {
  period: REPORT_CONFIG.defaultPeriod,
  periodStart: "",
  periodEnd: "",
};

const initialFilters = {
  policyId: "",
  severityKey: "",
  status: "",
};

export default function ReportsPage() {
  const auth = useContext(AuthContext);
  const canGenerate = auth?.hasPermission?.(PERMISSIONS.REPORTS_GENERATE);
  const canDownload = auth?.hasPermission?.(PERMISSIONS.REPORTS_DOWNLOAD);

  const { data: definitions, loading: definitionsLoading, error: definitionsError } =
    useReportDefinitions();
  const { data: preview, loading: previewLoading, error: previewError, preview: runPreview } =
    useReportPreview();
  const { run: generationRun, loading: generationLoading, error: generationError, generate } =
    useReportGeneration();

  const [reportCode, setReportCode] = useState(REPORT_CONFIG.defaultReportCode);
  const [period, setPeriod] = useState(initialPeriod);
  const [filters, setFilters] = useState(initialFilters);
  const [policies, setPolicies] = useState([]);
  const [runDetails, setRunDetails] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { rows, meta, loading: historyLoading, error: historyError, reload } = useReportRuns({
    page: historyPage,
    limit: REPORT_CONFIG.pageSize,
    reportCode,
  });

  useEffect(() => {
    if (!definitions.length) return;
    const exists = definitions.some((item) => item.code === reportCode);
    if (!exists) setReportCode(definitions[0].code);
  }, [definitions, reportCode]);

  useEffect(() => {
    let cancelled = false;

    async function loadPolicies() {
      try {
        const result = await slaApi.listPolicies({ page: 1, limit: 100, isActive: true });
        if (!cancelled) setPolicies(result.rows || []);
      } catch {
        if (!cancelled) setPolicies([]);
      }
    }

    void loadPolicies();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!generationRun?.id) return undefined;

    let active = true;
    let timer;

    const poll = async () => {
      try {
        const current = await reportsApi.getRun(generationRun.id);
        if (!active) return;

        setRunDetails(current);

        if (["QUEUED", "PROCESSING"].includes(current.status)) {
          timer = window.setTimeout(poll, REPORT_CONFIG.historyPollMs);
        } else {
          void reload();
        }
      } catch {
        if (active) {
          timer = window.setTimeout(poll, REPORT_CONFIG.historyPollMs);
        }
      }
    };

    void poll();

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [generationRun?.id, reload]);

  const payload = useMemo(
    () => buildReportPayload({ ...period, ...filters }),
    [period, filters],
  );

  async function handlePreview() {
    await runPreview(reportCode, payload);
  }

  async function handleGenerate() {
    const created = await generate(reportCode, payload);
    setRunDetails(created);
  }

  async function handleDownload(runId, artifactType) {
    if (!canDownload) return;
    const artifact = await reportsApi.download(runId, artifactType);
    createDownload(artifact.blob, artifact.fileName);
  }

  async function handleView(runId) {
    const details = await reportsApi.getRun(runId);
    setRunDetails(details);
    setDetailsOpen(true);
  }

  if (definitionsLoading) {
    return (
      <Stack alignItems="center" py={8}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (definitionsError) {
    return <Alert severity="error">Unable to load report definitions.</Alert>;
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack>
        <Typography variant="h5" fontWeight={700}>Reports</Typography>
        <Typography variant="body2" color="text.secondary">
          Generate reproducible SLA reports from historical SLA execution evidence.
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <ReportTypeSelector value={reportCode} onChange={setReportCode} definitions={definitions} />
          <ReportPeriodSelector value={period} onChange={setPeriod} />
          <ReportFilterPanel value={filters} onChange={setFilters} policies={policies} />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="outlined" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? "Calculating…" : "Preview"}
            </Button>
            {canGenerate && (
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={generationLoading || !preview || preview.reconciliation !== "PASS"}
              >
                {generationLoading ? "Queueing…" : "Generate Final Report"}
              </Button>
            )}
          </Stack>

          {previewError && <Alert severity="error">{previewError.response?.data?.message || "Preview failed."}</Alert>}
          {generationError && <Alert severity="error">{generationError.response?.data?.message || "Report generation failed."}</Alert>}
          <ReportPreview data={preview} loading={previewLoading} />
          <ReportStatus run={runDetails || generationRun} />
        </Stack>
      </Paper>

      <Divider />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Generated Report History</Typography>
          {historyError && <Alert severity="error">Unable to load report history.</Alert>}
          <ReportHistoryGrid
            rows={rows}
            loading={historyLoading}
            meta={meta}
            onPageChange={setHistoryPage}
            onRefresh={reload}
            onView={handleView}
            onDownload={handleDownload}
            canDownload={canDownload}
          />
        </Stack>
      </Paper>

      <ReportRunDetails
        run={runDetails}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </Box>
  );
}
