import { useEffect, useMemo, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  Autocomplete, Box, Button, Divider, FormControlLabel, Grid, Paper,
  Stack, Switch, TextField, Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { apiClient } from "../../../services/api/apiClient";
import slaApi from "../services/sla.api";
import { SLA_FIELDS } from "../config/sla.config";
import SlaDurationRuleTable from "./SlaDurationRuleTable";

const schema = Yup.object({
  code: Yup.string().trim().matches(/^[a-z0-9][a-z0-9_-]*$/, "Use lowercase letters, numbers, _ or -.").required("Code is required."),
  name: Yup.string().trim().max(150).required("Name is required."),
  triggerFieldKey: Yup.string().required("Trigger field is required."),
  triggerValueKey: Yup.string().required("Trigger value is required."),
  durationFieldKey: Yup.string().required("Duration field is required."),
  calendarId: Yup.string().uuid("Select a valid calendar.").required("Calendar is required."),
  priority: Yup.number().integer().min(0).required("Priority is required."),
  effectiveFrom: Yup.string().required("Effective date is required."),
});

const toIso = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

function PolicyFormBody({ formik, calendars }) {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formik;
  const [triggerOptions, setTriggerOptions] = useState([]);
  const [durationOptions, setDurationOptions] = useState([]);

  const selectedTrigger = SLA_FIELDS.find((item) => item.key === values.triggerFieldKey);
  const selectedDuration = SLA_FIELDS.find((item) => item.key === values.durationFieldKey);

  useEffect(() => {
    let active = true;
    if (!selectedTrigger) return undefined;
    apiClient.get(selectedTrigger.endpoint)
      .then((response) => {
        if (!active) return;
        const rows = response.data?.data ?? response.data ?? [];
        setTriggerOptions(rows.map((item) => ({ value: item.code ?? item.id, label: item.name ?? item.code })));
      })
      .catch(() => { if (active) setTriggerOptions([]); });
    return () => { active = false; };
  }, [selectedTrigger?.key]);

  useEffect(() => {
    let active = true;
    if (!selectedDuration) return undefined;
    apiClient.get(selectedDuration.endpoint)
      .then((response) => {
        if (!active) return;
        const rows = response.data?.data ?? response.data ?? [];
        setDurationOptions(rows.map((item) => ({ value: item.code ?? item.id, label: item.name ?? item.code })));
      })
      .catch(() => { if (active) setDurationOptions([]); });
    return () => { active = false; };
  }, [selectedDuration?.key]);

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6">Policy identity</Typography>
            <Typography variant="body2" color="text.secondary">Use a stable code and a clear administrator-facing name.</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth label="Code" name="code" value={values.code} onChange={handleChange} onBlur={handleBlur} error={touched.code && Boolean(errors.code)} helperText={touched.code && errors.code} />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField fullWidth label="Name" name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} error={touched.name && Boolean(errors.name)} helperText={touched.name && errors.name} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline minRows={2} label="Description" name="description" value={values.description} onChange={handleChange} inputProps={{ maxLength: 5000 }} />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6">Trigger and duration</Typography>
            <Typography variant="body2" color="text.secondary">Select the ticket field that activates tracking and the field that determines its duration.</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={SLA_FIELDS}
                value={selectedTrigger ?? null}
                onChange={(_, option) => { setFieldValue("triggerFieldKey", option?.key ?? ""); setFieldValue("triggerValueKey", ""); }}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => <TextField {...params} label="Trigger field" error={touched.triggerFieldKey && Boolean(errors.triggerFieldKey)} />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={triggerOptions}
                value={triggerOptions.find((item) => item.value === values.triggerValueKey) ?? null}
                onChange={(_, option) => setFieldValue("triggerValueKey", option?.value ?? "")}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => <TextField {...params} label="Trigger value" error={touched.triggerValueKey && Boolean(errors.triggerValueKey)} helperText={touched.triggerValueKey && errors.triggerValueKey} />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={SLA_FIELDS}
                value={selectedDuration ?? null}
                onChange={(_, option) => { setFieldValue("durationFieldKey", option?.key ?? ""); setFieldValue("rules", []); }}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => <TextField {...params} label="Duration field" error={touched.durationFieldKey && Boolean(errors.durationFieldKey)} />}
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Resolution rules</Typography>
            <Typography variant="body2" color="text.secondary">Blank resolution minutes means the selected value is intentionally not SLA-tracked.</Typography>
          </Box>
          <SlaDurationRuleTable values={values.rules} options={durationOptions} onChange={(next) => setFieldValue("rules", next)} />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6">Calendar and activation</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Autocomplete
                options={calendars}
                value={calendars.find((item) => item.id === values.calendarId) ?? null}
                onChange={(_, option) => setFieldValue("calendarId", option?.id ?? "")}
                getOptionLabel={(option) => option.name ?? option.code}
                renderInput={(params) => <TextField {...params} label="Business calendar" error={touched.calendarId && Boolean(errors.calendarId)} helperText={touched.calendarId && errors.calendarId} />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField fullWidth type="number" label="Priority" name="priority" value={values.priority} onChange={handleChange} inputProps={{ min: 0, step: 1 }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth type="datetime-local" label="Effective from" name="effectiveFrom" value={values.effectiveFrom} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth type="datetime-local" label="Effective to" name="effectiveTo" value={values.effectiveTo ?? ""} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <FormControlLabel control={<Switch checked={values.isActive} onChange={(event) => setFieldValue("isActive", event.target.checked)} />} label={values.isActive ? "Policy active" : "Policy inactive"} />
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function SlaPolicyForm({ initialValues, onSubmit, submitting = false, submitLabel = "Save policy" }) {
  const [calendars, setCalendars] = useState([]);
  const initial = useMemo(() => ({
    code: "",
    name: "",
    description: "",
    triggerFieldKey: "dependency_category",
    triggerValueKey: "",
    durationFieldKey: "severity",
    calendarId: "",
    priority: 100,
    effectiveFrom: new Date().toISOString().slice(0, 16),
    effectiveTo: "",
    isActive: true,
    rules: [],
    ...initialValues,
  }), [initialValues]);

  useEffect(() => {
    let active = true;
    slaApi.listCalendars({ page: 1, limit: 100, isActive: true })
      .then((result) => { if (active) setCalendars(result.rows ?? []); })
      .catch(() => { if (active) setCalendars([]); });
    return () => { active = false; };
  }, []);

  return (
    <Formik
      enableReinitialize
      initialValues={initial}
      validationSchema={schema}
      onSubmit={async (values, helpers) => {
        try {
          await onSubmit({
            ...values,
            effectiveFrom: toIso(values.effectiveFrom),
            effectiveTo: values.effectiveTo ? toIso(values.effectiveTo) : null,
          }, helpers);
        } catch (error) {
          helpers.setStatus(error.response?.data?.message ?? error.message ?? "Unable to save SLA policy.");
        }
      }}
    >
      {(formik) => (
        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          <Stack spacing={2}>
            {formik.status ? <Typography role="alert" color="error">{formik.status}</Typography> : null}
            <PolicyFormBody formik={formik} calendars={calendars} />
            <Divider />
            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={submitting || formik.isSubmitting}>
                {submitLabel}
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </Formik>
  );
}
