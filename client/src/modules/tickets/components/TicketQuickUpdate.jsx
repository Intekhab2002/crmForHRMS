import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import CanAccess from "../../../components/rbac/CanAccess";
import { TICKET_MODULE_CONFIG } from "../../../config/ticket.config";

const QUICK_UPDATE_FIELDS = [
  {
    key: "status",
    label: "Status",
    permission: TICKET_MODULE_CONFIG.permissions.update,
  },
  {
    key: "assigned_to",
    label: "Assigned To",
    permission: TICKET_MODULE_CONFIG.permissions.assign,
  },
  {
    key: "severity",
    label: "Severity",
    permission: TICKET_MODULE_CONFIG.permissions.update,
  },
  {
    key: "dependency_category",
    label: "Dependency Category",
    permission: TICKET_MODULE_CONFIG.permissions.update,
  },
];

function normalizeValue(value) {
  return value == null ? "" : String(value);
}

export default function TicketQuickUpdate({
  currentValues = {},
  pendingValues = {},
  options = {},
  optionsLoading = {},
  saving = false,
  onValueChange,
  onSave,
  onReset,
}) {
  const hasChanges = QUICK_UPDATE_FIELDS.some(
    ({ key }) =>
      normalizeValue(currentValues[key]) !== normalizeValue(pendingValues[key]),
  );

  const isLoading = QUICK_UPDATE_FIELDS.some(({ key }) => optionsLoading[key]);

  return (
    <Stack
      spacing={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        gap: 2,
        width: "100%",
        minWidth: 0,
        p: { xs: 1.5, sm: 2 },
        boxSizing: "border-box",
        "& > *": {
          minWidth: 0,
          maxWidth: "100%",
        },
        "& .MuiFormControl-root": {
          width: "100%",
          minWidth: 0,
        },
        "& .MuiSelect-select": {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="body2" color="text.secondary">
          Update frequently changed ticket fields
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Only changed values will be submitted.
        </Typography>
      </Stack>

      {isLoading ? (
        <Alert severity="info">Loading ticket update options…</Alert>
      ) : null}

      <Stack
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          minWidth: 0,
        }}
      >
        {QUICK_UPDATE_FIELDS.map((field) => {
          const fieldOptions = options[field.key] ?? [];
          const fieldLoading = Boolean(optionsLoading[field.key]);

          return (
            <CanAccess key={field.key} permission={field.permission}>
              <FormControl
                size="small"
                fullWidth
                disabled={saving || fieldLoading}
                sx={{ minWidth: 0 }}
              >
                <InputLabel id={`quick-update-${field.key}-label`}>
                  {field.label}
                </InputLabel>

                <Select
                  labelId={`quick-update-${field.key}-label`}
                  id={`quick-update-${field.key}`}
                  label={field.label}
                  value={normalizeValue(pendingValues[field.key])}
                  onChange={(event) =>
                    onValueChange(field.key, event.target.value)
                  }
                >
                  <MenuItem value="">
                    <em>Not set</em>
                  </MenuItem>

                  {fieldOptions.map((option) => (
                    <MenuItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CanAccess>
          );
        })}
      </Stack>

      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        spacing={1}
        flexWrap="wrap"
        sx={{
          width: "100%",
          "& .MuiButton-root": {
            flex: "0 0 auto",
          },
          "@media (max-width:599.95px)": {
            justifyContent: "stretch",
            "& .MuiButton-root": {
              flex: "1 1 auto",
            },
          },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<RestartAltOutlinedIcon />}
          onClick={onReset}
          disabled={saving || !hasChanges}
        >
          Discard Changes
        </Button>

        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          onClick={onSave}
          disabled={saving || isLoading || !hasChanges}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </Stack>
    </Stack>
  );
}
