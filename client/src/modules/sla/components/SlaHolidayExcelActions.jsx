import { useRef, useState } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CanAccess from "../../../components/rbac/CanAccess";
import slaApi from "../services/sla.api";
import { SLA_PERMISSIONS } from "../config/sla.config";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message ?? error?.message ?? fallback;
}

function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export default function SlaHolidayExcelActions({
  calendarId,
  year,
  onImported,
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleDownload = async () => {
    setDownloading(true);
    setMessage(null);

    try {
      const response = await slaApi.downloadHolidayTemplate(calendarId, year);
      const contentType = response?.headers?.["content-type"] || XLSX_MIME;
      const blob =
        response?.data instanceof Blob
          ? response.data
          : new Blob([response?.data], { type: contentType });

      triggerBlobDownload(blob, `sla-holidays-${year}-template.xlsx`);
    } catch (error) {
      setMessage({
        severity: "error",
        text: getErrorMessage(error, "Unable to download the Excel template."),
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null;

    setMessage(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setMessage({
        severity: "error",
        text: "Please select an .xlsx file.",
      });
      event.target.value = "";
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setMessage({
        severity: "error",
        text: "The Excel file must not exceed 2 MB.",
      });
      event.target.value = "";
      return;
    }

    setFile(selected);
  };

  const handleImport = async () => {
    if (!file) {
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const result = await slaApi.importHolidays(calendarId,  year,file);
      const data = result ?? {};

      setMessage({
        severity: "success",
        text: `Import completed: ${Number(data.created ?? 0)} added, ${Number(
          data.updated ?? 0,
        )} updated.`,
      });

      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await onImported?.();
    } catch (error) {
      const validationErrors = error?.response?.data?.data?.errors;

      setMessage({
        severity: "error",
        text: validationErrors?.length
          ? validationErrors
              .map(
                (item) =>
                  `Row ${item.row ?? "?"}: ${item.message ?? "Invalid value."}`,
              )
              .join(" ")
          : getErrorMessage(error, "Unable to import the Excel file."),
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.25}>
          <Typography variant="h6" component="h2">
            Excel import / export
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Download the template, update holiday dates and names, then import
            the workbook.
          </Typography>
        </Stack>

        {message ? (
          <Alert severity={message.severity}>{message.text}</Alert>
        ) : null}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          flexWrap="wrap"
        >
          <CanAccess permission={SLA_PERMISSIONS.holidayRead}>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={handleDownload}
              disabled={downloading || importing}
            >
              {downloading ? "Downloading…" : "Download Excel template"}
            </Button>
          </CanAccess>

          <CanAccess permission={SLA_PERMISSIONS.holidayCreate}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileOutlinedIcon />}
              disabled={importing || downloading}
            >
              Choose Excel file
              <input
                ref={inputRef}
                hidden
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
              />
            </Button>
          </CanAccess>

          <CanAccess permission={SLA_PERMISSIONS.holidayCreate}>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={!file || importing || downloading}
            >
              {importing ? "Importing…" : "Import Excel"}
            </Button>
          </CanAccess>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {file
            ? `Selected: ${file.name}`
            : ".xlsx only • Maximum file size 2 MB"}
        </Typography>
      </Stack>
    </Paper>
  );
}
