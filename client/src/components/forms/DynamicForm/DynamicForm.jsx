import { Alert, Button, Grid, Stack, Typography } from "@mui/material";
import { Formik } from "formik";
import DynamicFieldRenderer from "./DynamicFieldRenderer";
import { buildInitialValues, groupFieldsBySection } from "./dynamicForm.utils";
import { buildValidationSchema } from "./dynamicForm.validation";

export default function DynamicForm({
  configuration,
  initialValues: initialValuesOverride,
  onSubmit,
  submitting = false,
  submitLabel = "Submit",
}) {
  const fields = configuration?.fields ?? [];

  if (!configuration) {
    return <Alert severity="warning">Form configuration is unavailable.</Alert>;
  }

  if (!fields.length) {
    return <Alert severity="info">No fields have been configured for this form.</Alert>;
  }

  const initialValues = {
    ...buildInitialValues(fields),
    ...(initialValuesOverride ?? {}),
  };

  const validationSchema = buildValidationSchema(fields);
  const sections = groupFieldsBySection(fields);

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {(formik) => (
        <form onSubmit={formik.handleSubmit} noValidate>
          <Stack spacing={3}>
            <div>
              <Typography variant="h5">{configuration.name}</Typography>
              {configuration.description ? (
                <Typography variant="body2" color="text.secondary">
                  {configuration.description}
                </Typography>
              ) : null}
            </div>

            {Object.entries(sections).map(([sectionName, sectionFields]) => (
              <Stack key={sectionName} spacing={2}>
                <Typography variant="h6">{sectionName}</Typography>
                <Grid container spacing={2}>
                  {sectionFields.map((field) => (
                    <Grid
                      key={field.id}
                      size={field.gridSize || 12}
                      sx={{ width: field.columnWidth || undefined }}
                    >
                      <DynamicFieldRenderer field={field} formik={formik} />
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            ))}

            <Stack direction="row" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || formik.isSubmitting}
              >
                {submitting || formik.isSubmitting ? "Submitting..." : submitLabel}
              </Button>
            </Stack>
          </Stack>
        </form>
      )}
    </Formik>
  );
}