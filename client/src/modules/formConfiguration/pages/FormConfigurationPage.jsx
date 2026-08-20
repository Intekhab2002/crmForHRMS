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
  Chip,
  Divider,
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

import FormConfigurationTable from "../components/FormConfigurationTable";
import FormConfigurationDialog from "../components/FormConfigurationDialog";
import FieldAssignmentDialog from "../components/FieldAssignmentDialog";

export default function FormConfigurationPage() {
  const {
    hasPermission,
  } = useAuth();

  const [
    forms,
    setForms,
  ] = useState([]);

  const [
    fields,
    setFields,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    editingForm,
    setEditingForm,
  ] = useState(null);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    assignmentOpen,
    setAssignmentOpen,
  ] = useState(false);

  const [
    selectedForm,
    setSelectedForm,
  ] = useState(null);

  const canRead =
    hasPermission(
      FORM_CONFIGURATION_PERMISSIONS.READ,
    );

  const canCreate =
    hasPermission(
      FORM_CONFIGURATION_PERMISSIONS.CREATE,
    );

  const canUpdate =
    hasPermission(
      FORM_CONFIGURATION_PERMISSIONS.UPDATE,
    );

  const canDelete =
    hasPermission(
      FORM_CONFIGURATION_PERMISSIONS.DELETE,
    );

  const canReadFields =
    hasPermission(
      FORM_CONFIGURATION_PERMISSIONS.FIELD_READ,
    );

  const loadData =
    useCallback(
      async () => {
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
            requestError
              ?.response
              ?.data
              ?.message ??
              requestError.message ??
              "Unable to load form configuration.",
          );
        } finally {
          setLoading(false);
        }
      },
      [canReadFields],
    );

  useEffect(() => {
    if (canRead) {
      void loadData();
    }
  }, [canRead, loadData]);

  const availableFields =
    useMemo(() => {
      if (!selectedForm) {
        return fields;
      }

      const assignedIds =
        new Set(
          (
            selectedForm.fields ??
            []
          ).map(
            (field) =>
              field.fieldId ??
              field.id,
          ),
        );

      return fields.filter(
        (field) =>
          !assignedIds.has(
            field.id,
          ),
      );
    }, [
      fields,
      selectedForm,
    ]);

async function handleSubmit(values) {
    setSubmitting(true);
    setError("");

    try {
        const payload = {
            name: values.name,
            label: values.label,
            description:
                values.description || null,

            type: values.type,
            dataType: values.dataType,

            placeholder:
                values.placeholder || null,

            helpText:
                values.helpText || null,

            defaultValue:
                values.defaultValue || null,

            status: values.status,

            isVisible:
                values.isVisible,

            isEnabled:
                values.isEnabled,

            isEditable:
                values.isEditable,

            isReadOnly:
                values.isReadOnly,

            isRequired:
                values.isRequired,

            isSearchable:
                values.isSearchable,

            isFilterable:
                values.isFilterable,

            isSortable:
                values.isSortable,

            validationConfig:
                values.validationConfig ?? {},

            optionsConfig:
                values.optionsConfig ?? {},
        };

        if (editingField) {
            await formConfigurationApi.updateField(
                editingField.id,
                payload,
            );
        } else {
            await formConfigurationApi.createField({
                fieldKey: values.fieldKey,
                ...payload,
            });
        }

        setDialogOpen(false);
        setEditingField(null);

        await loadFields();
    } catch (requestError) {
        setError(
            requestError
                ?.response
                ?.data
                ?.message ??
            requestError.message ??
            "Unable to save form field.",
        );
    } finally {
        setSubmitting(false);
    }
}

  async function handleDelete(form) {
    const confirmed =
      window.confirm(
        `Delete form "${form.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await formConfigurationApi.deleteForm(
        form.id,
      );

      await loadData();
    } catch (requestError) {
      setError(
        requestError
          ?.response
          ?.data
          ?.message ??
          requestError.message ??
          "Unable to delete form.",
      );
    }
  }

  async function handleAssignField(
    values,
  ) {
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

      setAssignmentOpen(false);

      const response =
        await formConfigurationApi.getForm(
          selectedForm.id,
        );

      setSelectedForm(
        response?.data ?? null,
      );
    } catch (requestError) {
      setError(
        requestError
          ?.response
          ?.data
          ?.message ??
          requestError.message ??
          "Unable to assign field.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!canRead) {
    return (
      <Alert severity="error">
        You do not have permission
        to manage form
        configuration.
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
            Manage reusable CRM forms
            and their field assignments.
          </Typography>
        </Box>

        {canCreate ? (
          <Button
            variant="contained"
            startIcon={
              <AddIcon />
            }
            onClick={() => {
              setEditingForm(null);
              setDialogOpen(true);
            }}
          >
            Create Form
          </Button>
        ) : null}
      </Stack>

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() =>
            setError("")
          }
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
            onCreate={() => {
              setEditingForm(null);
              setDialogOpen(true);
            }}
            onEdit={(form) => {
              setEditingForm(form);
              setDialogOpen(true);
            }}
            onDelete={handleDelete}
            onManageFields={(form) => {
              setSelectedForm(form);
              setAssignmentOpen(true);
            }}
          />
        </CardContent>
      </Card>

      <FormConfigurationDialog
        open={dialogOpen}
        form={editingForm}
        submitting={submitting}
        error={error}
        onClose={() => {
          setDialogOpen(false);
          setEditingForm(null);
          setError("");
        }}
        onSubmit={handleSubmit}
      />

      <FieldAssignmentDialog
        open={assignmentOpen}
        fields={availableFields}
        submitting={submitting}
        error={error}
        onClose={() => {
          setAssignmentOpen(false);
          setSelectedForm(null);
          setError("");
        }}
        onSubmit={handleAssignField}
      />
    </Box>
  );
}