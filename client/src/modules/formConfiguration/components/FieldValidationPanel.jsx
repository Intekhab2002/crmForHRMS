import { Grid, Stack, TextField, FormControlLabel, Checkbox } from "@mui/material";

export default function FieldValidationPanel({ values, setFieldValue }) {
  const config = values.validationConfig ?? {};

  function setConfig(key, value) {
    setFieldValue("validationConfig", {
      ...config,
      [key]: value,
    });
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          type="number"
          label="Minimum Length"
          value={config.minLength ?? ""}
          onChange={(event) =>
            setConfig(
              "minLength",
              event.target.value === "" ? undefined : Number(event.target.value),
            )
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          type="number"
          label="Maximum Length"
          value={config.maxLength ?? ""}
          onChange={(event) =>
            setConfig(
              "maxLength",
              event.target.value === "" ? undefined : Number(event.target.value),
            )
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          type="number"
          label="Minimum Value"
          value={config.minValue ?? ""}
          onChange={(event) =>
            setConfig(
              "minValue",
              event.target.value === "" ? undefined : Number(event.target.value),
            )
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          type="number"
          label="Maximum Value"
          value={config.maxValue ?? ""}
          onChange={(event) =>
            setConfig(
              "maxValue",
              event.target.value === "" ? undefined : Number(event.target.value),
            )
          }
        />
      </Grid>

      <Grid size={12}>
        <TextField
          fullWidth
          label="Regular Expression"
          value={config.regexPattern ?? ""}
          onChange={(event) => setConfig("regexPattern", event.target.value || undefined)}
          helperText="Declarative pattern only; executable JavaScript is not permitted."
        />
      </Grid>

      <Grid size={12}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(config.email)}
                onChange={(event) => setConfig("email", event.target.checked || undefined)}
              />
            }
            label="Email"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(config.url)}
                onChange={(event) => setConfig("url", event.target.checked || undefined)}
              />
            }
            label="URL"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(config.integer)}
                onChange={(event) => setConfig("integer", event.target.checked || undefined)}
              />
            }
            label="Integer"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(config.decimal)}
                onChange={(event) => setConfig("decimal", event.target.checked || undefined)}
              />
            }
            label="Decimal"
          />
        </Stack>
      </Grid>
    </Grid>
  );
}
