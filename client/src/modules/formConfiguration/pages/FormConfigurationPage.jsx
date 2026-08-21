import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import { useAuth } from "../../../context/useAuth";

import {
  formConfigurationApi,
} from "../api/formConfiguration.api";

import {
  FORM_CONFIGURATION_PERMISSIONS,
} from "../formConfiguration.constants";

import FormConfigurationTable
  from "../components/FormConfigurationTable";

import FormConfigurationDialog
  from "../components/FormConfigurationDialog";

import FieldAssignmentDialog
  from "../components/FieldAssignmentDialog";

export default function FormConfigurationPage() {
  const { hasPermission } = useAuth();

  const [forms, setForms] = useState([]);
  const [fields, setFields] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  const canRead = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.READ,
  );

  const canCreate = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.CREATE,
  );

  const canUpdate = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.UPDATE,
  );

  const canDelete = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.DELETE,
  );

  const canReadFields = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.FIELD_READ,
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        formsResponse,
        fieldsResponse,
      ] = await Promise.all([
        formConfigurationApi.listForms({
          page: 1,
          limit: 100,
        }),

        canReadFields
          ? formConfigurationApi.listFields({
              page: 1,
              limit: 100,
            })
          : Promise.resolve(null),
      ]);

      setForms(
        formsResponse?.data ?? [],
      );

      setFields(
        fieldsResponse?.data ?? [],
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to load form configuration.",
      );
    } finally {
      setLoading(false);
    }
  }, [canReadFields]);

  useEffect(() => {
    if (canRead) {
      void loadData();
    }
  }, [canRead, loadData]);

  const availableFields = useMemo(() => {
    if (!selectedForm) {
      return fields;
    }

    const assignedIds = new Set(
      (selectedForm.fields ?? []).map(
        (field) =>
          field.fieldId ??
          field.id,
      ),
    );

    return fields.filter(
      (field) =>
        !assignedIds.has(field.id),
    );
  }, [fields, selectedForm]);

  async function handleSubmit(values) {
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: values.name.trim(),
        module: values.module.trim(),
        description:
          values.description?.trim() || null,
        status: values.status,
      };

      if (editingForm) {
        await formConfigurationApi.updateForm(
          editingForm.id,
          payload,
        );
      } else {
        await formConfigurationApi.createForm({
          code: values.code.trim(),
          ...payload,
        });
      }

      setDialogOpen(false);
      setEditingForm(null);

      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to save form.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(form) {
    const confirmed = window.confirm(
      `Delete form "${form.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await formConfigurationApi.deleteForm(
        form.id,
      );

      if (
        selectedForm?.id === form.id
      ) {
        setSelectedForm(null);
        setAssignmentOpen(false);
      }

      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to delete form.",
      );
    }
  }

  async function handleAssignField(values) {
    if (!selectedForm) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await formConfigurationApi.assignField(
        selectedForm.id,
        values,
      );

      const response =
        await formConfigurationApi.getForm(
          selectedForm.id,
        );

      const updatedForm =
        response?.data ?? null;

      setSelectedForm(updatedForm);
      setAssignmentOpen(false);

      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to assign field.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openCreateDialog() {
    setEditingForm(null);
    setError("");
    setDialogOpen(true);
  }

  function openEditDialog(form) {
    setEditingForm(form);
    setError("");
    setDialogOpen(true);
  }

  function closeFormDialog() {
    if (submitting) {
      return;
    }

    setDialogOpen(false);
    setEditingForm(null);
    setError("");
  }

  function openAssignmentDialog(form) {
    setSelectedForm(form);
    setError("");
    setAssignmentOpen(true);
  }

  function closeAssignmentDialog() {
    if (submitting) {
      return;
    }

    setAssignmentOpen(false);
    setSelectedForm(null);
    setError("");
  }

  if (!canRead) {
    return (
      <Alert severity="error">
        You do not have permission to manage
        form configuration.
      </Alert>
    );
  }

  return (
    <Box>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          sm: "center",
        }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
          >
            Form Configuration
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
          >
            Manage reusable CRM forms and
            their field assignments.
          </Typography>
        </Box>

        {canCreate ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Create Form
          </Button>
        ) : null}
      </Stack>

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <FormConfigurationTable
            rows={forms}
            loading={loading}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onCreate={openCreateDialog}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            onManageFields={
              openAssignmentDialog
            }
          />
        </CardContent>
      </Card>

      <FormConfigurationDialog
        open={dialogOpen}
        form={editingForm}
        submitting={submitting}
        error={error}
        onClose={closeFormDialog}
        onSubmit={handleSubmit}
      />

      <FieldAssignmentDialog
        open={assignmentOpen}
        fields={availableFields}
        submitting={submitting}
        error={error}
        onClose={closeAssignmentDialog}
        onSubmit={handleAssignField}
      />
    </Box>
  );
}