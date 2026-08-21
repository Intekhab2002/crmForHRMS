import {
  Alert,
  Button,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  Formik,
} from "formik";

import DynamicFieldRenderer from "./DynamicFieldRenderer";

import {
  buildInitialValues,
} from "./dynamicForm.utils";

export default function DynamicForm({
  configuration,
  onSubmit,
  submitting = false,
  submitLabel = "Submit",
}) {
  const fields =
    configuration?.fields ?? [];

  const initialValues =
    buildInitialValues(fields);

  if (!configuration) {
    return (
      <Alert severity="warning">
        Form configuration is unavailable.
      </Alert>
    );
  }

  if (!fields.length) {
    return (
      <Alert severity="info">
        No fields have been configured
        for this form.
      </Alert>
    );
  }

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {(formik) => (
        <form
          onSubmit={formik.handleSubmit}
          noValidate
        >
          <Stack spacing={3}>
            <div>
              <Typography variant="h5">
                {configuration.name}
              </Typography>

              {configuration.description ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {configuration.description}
                </Typography>
              ) : null}
            </div>

            <Grid
              container
              spacing={2}
            >
              {fields.map((field) => (
                <Grid
                  key={field.id}
                  size={
                    field.gridSize || 12
                  }
                >
                  <DynamicFieldRenderer
                    field={field}
                    formik={formik}
                  />
                </Grid>
              ))}
            </Grid>

            <Stack
              direction="row"
              justifyContent="flex-end"
            >
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : submitLabel}
              </Button>
            </Stack>
          </Stack>
        </form>
      )}
    </Formik>
  );
}