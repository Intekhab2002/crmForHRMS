import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const INITIAL_VALUES = Object.freeze({
  createdDate: "",
  ticketNumber: "",
  mobileNumber: "",
  emailId: "",
});

function hasAdditionalIdentifier(values) {
  return Boolean(
    values.ticketNumber.trim() ||
      values.mobileNumber.trim() ||
      values.emailId.trim(),
  );
}

export default function PublicTicketSearchForm({
  config,
  loading = false,
  onSubmit,
}) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [validationError, setValidationError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    if (validationError) {
      setValidationError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!values.createdDate) {
      setValidationError(
        "Ticket created date is required.",
      );
      return;
    }

    if (!hasAdditionalIdentifier(values)) {
      setValidationError(
        "Please provide at least one of ticket number, mobile number, or email ID.",
      );
      return;
    }

    setValidationError("");

    await onSubmit({
      createdDate: values.createdDate,
      ticketNumber:
        values.ticketNumber.trim() || undefined,
      mobileNumber:
        values.mobileNumber.trim() || undefined,
      emailId:
        values.emailId.trim() || undefined,
    });
  }

  function handleReset() {
    setValues(INITIAL_VALUES);
    setValidationError("");
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
          >
            Find Your Ticket
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {config.helperText}
          </Typography>
        </Box>

        {validationError ? (
          <Alert severity="warning">
            {validationError}
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              required
              type="date"
              name="createdDate"
              label={config.createdDateLabel}
              value={values.createdDate}
              onChange={handleChange}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              name="ticketNumber"
              label={config.ticketNumberLabel}
              placeholder={config.ticketNumberPlaceholder}
              value={values.ticketNumber}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              name="mobileNumber"
              label={config.mobileNumberLabel}
              placeholder={config.mobileNumberPlaceholder}
              value={values.mobileNumber}
              onChange={handleChange}
              inputMode="tel"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="email"
              name="emailId"
              label={config.emailIdLabel}
              placeholder={config.emailIdPlaceholder}
              value={values.emailId}
              onChange={handleChange}
            />
          </Grid>
        </Grid>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="flex-end"
        >
          <Button
            type="button"
            variant="outlined"
            onClick={handleReset}
            disabled={loading}
          >
            {config.resetLabel}
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            loading={loading}
          >
            {config.submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}