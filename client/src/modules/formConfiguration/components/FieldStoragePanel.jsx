import {
  Alert,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import {
  STORAGE_TYPE_OPTIONS,
} from "../utils/fieldDefaults";

export default function FieldStoragePanel({ values, setFieldValue, readOnly = false }) {
  function changeStorageType(event) {
    const storageType = event.target.value;
    setFieldValue("storageType", storageType);

    if (storageType !== "relational") setFieldValue("storageColumn", "");
    if (storageType !== "custom_data" && storageType !== "specialized") {
      setFieldValue("storageKey", "");
    }
    if (storageType !== "reference") setFieldValue("referenceEntity", "");
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 5 }}>
        <FormControl fullWidth>
          <InputLabel>Storage Type</InputLabel>
          <Select
            label="Storage Type"
            value={values.storageType ?? ""}
            onChange={changeStorageType}
            disabled={readOnly}
          >
            {STORAGE_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        {values.storageType === "relational" ? (
          <TextField
            fullWidth
            label="Storage Column"
            value={values.storageColumn ?? ""}
            onChange={(event) => setFieldValue("storageColumn", event.target.value)}
            disabled={readOnly}
          />
        ) : null}

        {["custom_data", "specialized"].includes(values.storageType) ? (
          <TextField
            fullWidth
            label="Storage Key"
            value={values.storageKey ?? ""}
            onChange={(event) => setFieldValue("storageKey", event.target.value)}
            disabled={readOnly}
          />
        ) : null}

        {values.storageType === "reference" ? (
          <TextField
            fullWidth
            label="Reference Entity"
            value={values.referenceEntity ?? ""}
            onChange={(event) => setFieldValue("referenceEntity", event.target.value)}
            disabled={readOnly}
          />
        ) : null}
      </Grid>

      <Grid size={12}>
        <Alert severity="info">
          Storage mapping is an administrative persistence contract. It does not
          generate database schema changes and should not be changed casually after
          a field has been used.
        </Alert>
      </Grid>
    </Grid>
  );
}
