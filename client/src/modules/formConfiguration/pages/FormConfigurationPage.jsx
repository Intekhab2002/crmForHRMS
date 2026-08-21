import { useCallback, useEffect, useMemo, useState } from "react";

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

import { formConfigurationApi } from "../api/formConfiguration.api";

import { FORM_CONFIGURATION_PERMISSIONS } from "../formConfiguration.constants";

import FormConfigurationTable from "../components/FormConfigurationTable";

import FormConfigurationDialog from "../components/FormConfigurationDialog";

import FieldAssignmentDialog from "../components/FieldAssignmentDialog";

import FormAssignedFieldsTable from "../components/FormAssignedFieldsTable";

export default function FormConfigurationPage() {
  const { hasPermission } = useAuth();

  const [forms, setForms] = useState([]);
  const [fields, setFields] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [assignmentManagerOpen, setAssignmentManagerOpen] = useState(false);

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  const [selectedForm, setSelectedForm] = useState(null);

  const [editingAssignment, setEditingAssignment] = useState(null);

  const canRead = hasPermission(FORM_CONFIGURATION_PERMISSIONS.READ);

  const canCreate = hasPermission(FORM_CONFIGURATION_PERMISSIONS.CREATE);

  const canUpdate = hasPermission(FORM_CONFIGURATION_PERMISSIONS.UPDATE);

  const canDelete = hasPermission(FORM_CONFIGURATION_PERMISSIONS.DELETE);

  const canReadFields = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.FIELD_READ,
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [formsResponse, fieldsResponse] = await Promise.all([
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

      setForms(formsResponse?.data ?? []);

      setFields(fieldsResponse?.data ?? []);
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
      (selectedForm.fields ?? []).map((field) => field.fieldId ?? field.id),
    );

    return fields.filter((field) => !assignedIds.has(field.id));
  }, [fields, selectedForm]);

  async function handleSubmit(values) {
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: values.name.trim(),
        module: values.module.trim(),
        description: values.description?.trim() || null,
        status: values.status,
      };

      if (editingForm) {
        await formConfigurationApi.updateForm(editingForm.id, payload);
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
    const confirmed = window.confirm(`Delete form "${form.name}"?`);

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await formConfigurationApi.deleteForm(form.id);

      if (selectedForm?.id === form.id) {
        setSelectedForm(null);
        setAssignmentManagerOpen(false);
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
      await formConfigurationApi.assignField(selectedForm.id, values);

      const response = await formConfigurationApi.getForm(selectedForm.id);

      const updatedForm = response?.data ?? null;

      setSelectedForm(updatedForm);
      setAssignmentDialogOpen(false);

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

  async function openAssignmentManager(form) {
    setError("");

    try {
      const response = await formConfigurationApi.getForm(form.id);

      setSelectedForm(
        response?.data ?? {
          ...form,
          fields: [],
        },
      );

      setAssignmentManagerOpen(true);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to load form fields.",
      );
    }
  }

  async function handleRemoveField(assignment) {
    if (!selectedForm) {
      return;
    }

    const confirmed = window.confirm(
      `Remove "${assignment.fieldKey}" from "${selectedForm.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await formConfigurationApi.removeField(
        selectedForm.id,
        assignment.fieldId,
      );

      const response = await formConfigurationApi.getForm(selectedForm.id);

      setSelectedForm(response?.data ?? null);

      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.message ??
          "Unable to remove field from form.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function closeAssignmentManager() {
    if (submitting) {
      return;
    }

    setAssignmentManagerOpen(false);
    setAssignmentDialogOpen(false);
    setEditingAssignment(null);
    setSelectedForm(null);
    setError("");
  }

  if (!canRead) {
    return (
      <Alert severity="error">
        You do not have permission to manage form configuration.
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
          <Typography variant="h4" fontWeight={700}>
            Form Configuration
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage reusable CRM forms and their field assignments.
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
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
            onManageFields={openAssignmentManager}
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

      {assignmentManagerOpen && selectedForm ? (
        <Card sx={{ mt: 3 }}>
          <CardContent>
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
              mb={2}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {selectedForm.name}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {selectedForm.code}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={closeAssignmentManager}
                  disabled={submitting}
                >
                  Close
                </Button>

                {canUpdate ? (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingAssignment(null);
                      setError("");
                      setAssignmentDialogOpen(true);
                    }}
                  >
                    Add Field
                  </Button>
                ) : null}
              </Stack>
            </Stack>

            <FormAssignedFieldsTable
              rows={selectedForm.fields ?? []}
              loading={submitting}
              canUpdate={canUpdate}
              onEdit={(assignment) => {
                setEditingAssignment(
                  assignment,
                );
                setAssignmentDialogOpen(true);
              }}
              onRemove={handleRemoveField}
            />
          </CardContent>
        </Card>
      ) : null}

      <FieldAssignmentDialog
        open={assignmentDialogOpen}
        fields={availableFields}
        submitting={submitting}
        error={error}
        assignment={editingAssignment}
        onClose={() => {
          if (submitting) {
            return;
          }

          setAssignmentDialogOpen(false);
          setEditingAssignment(null);
          setError("");
        }}
        onSubmit={handleAssignField}
      />
    </Box>
  );
}
