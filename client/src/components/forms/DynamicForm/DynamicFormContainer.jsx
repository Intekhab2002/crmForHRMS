import {
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";

import DynamicForm from "./DynamicForm";
import useRuntimeForm from "./useRuntimeForm";

export default function DynamicFormContainer({
  formCode,
  initialValues,
  onSubmit,
  submitting = false,
  submitLabel = "Submit",
}) {
  const {
    data,
    loading,
    error,
  } = useRuntimeForm(formCode);

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ py: 6 }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    const message =
      error?.message ??
      error?.response?.data?.message ??
      "Unable to load form configuration.";

    return (
      <Alert severity="error">
        {message}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="warning">
        Form configuration is unavailable.
      </Alert>
    );
  }

  return (
    <DynamicForm
      configuration={data}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitting={submitting}
      submitLabel={submitLabel}
    />
  );
}