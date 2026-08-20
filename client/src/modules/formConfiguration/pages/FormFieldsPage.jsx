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
  TextField,
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

import FormFieldTable from "../components/FormFieldTable";
import FormFieldDialog from "../components/FormFieldDialog";



function buildFieldUpdatePayload(values) {
    return {
        name: values.name,
        label: values.label,
        description: values.description ?? null,

        type: values.type,
        dataType: values.dataType,

        placeholder:
            values.placeholder ?? null,

        helpText:
            values.helpText ?? null,

        defaultValue:
            values.defaultValue ?? null,

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
}

export default function FormFieldsPage() {
  const {
    hasPermission,
  } = useAuth();

  const canRead = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.FIELD_READ,
  );

  const canCreate = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.FIELD_CREATE,
  );

  const canUpdate = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.FIELD_UPDATE,
  );

  const canDelete = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.FIELD_DELETE,
  );

  const canRestore = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.FIELD_RESTORE,
  );

  const canEnable = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.FIELD_ENABLE,
  );

  const canDisable = hasPermission(
    FORM_CONFIGURATION_PERMISSIONS.FIELD_DISABLE,
  );

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editingField, setEditingField] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const loadFields = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await formConfigurationApi.listFields({
            page: 1,
            limit: 100,
          });

        setFields(
          response?.data ?? [],
        );
      } catch (requestError) {
        setError(
          requestError
            ?.response
            ?.data
            ?.message ??
            requestError.message ??
            "Unable to load form fields.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (canRead) {
      void loadFields();
    }
  }, [canRead, loadFields]);

  const filteredFields = useMemo(() => {
    const normalizedSearch =
      search
        .trim()
        .toLowerCase();

    if (!normalizedSearch) {
      return fields;
    }

    return fields.filter(
      (field) =>
        field.fieldKey
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        field.name
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        field.label
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        field.type
          ?.toLowerCase()
          .includes(normalizedSearch),
    );
  }, [fields, search]);

async function handleSubmit(values) {
    setSubmitting(true);
    setError("");

    try {
        if (editingField) {
            const payload =
                buildFieldUpdatePayload(values);

            await formConfigurationApi.updateField(
                editingField.id,
                payload,
            );
        } else {
            await formConfigurationApi.createField(
                values,
            );
        }

        setDialogOpen(false);
        setEditingField(null);

        await loadFields();
    } catch (requestError) {
        setError(
            requestError?.response?.data?.message ??
            requestError?.message ??
            "Unable to save form field.",
        );
    } finally {
        setSubmitting(false);
    }
}

  async function handleDelete(field) {
    if (
      !window.confirm(
        `Delete field "${field.label}"?`,
      )
    ) {
      return;
    }

    try {
      await formConfigurationApi.deleteField(
        field.id,
      );

      await loadFields();
    } catch (requestError) {
      setError(
        requestError
          ?.response
          ?.data
          ?.message ??
          requestError.message ??
          "Unable to delete form field.",
      );
    }
  }

  async function handleRestore(field) {
    try {
      await formConfigurationApi.restoreField(
        field.id,
      );

      await loadFields();
    } catch (requestError) {
      setError(
        requestError
          ?.response
          ?.data
          ?.message ??
          requestError.message ??
          "Unable to restore form field.",
      );
    }
  }

  async function handleEnable(field) {
    try {
      await formConfigurationApi.enableField(
        field.id,
      );

      await loadFields();
    } catch (requestError) {
      setError(
        requestError
          ?.response
          ?.data
          ?.message ??
          requestError.message ??
          "Unable to enable form field.",
      );
    }
  }

  async function handleDisable(field) {
    try {
      await formConfigurationApi.disableField(
        field.id,
      );

      await loadFields();
    } catch (requestError) {
      setError(
        requestError
          ?.response
          ?.data
          ?.message ??
          requestError.message ??
          "Unable to disable form field.",
      );
    }
  }

  if (!canRead) {
    return (
      <Alert severity="error">
        You do not have permission to
        manage form fields.
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
            Form Fields
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
          >
            Manage reusable fields used
            across CRM forms.
          </Typography>
        </Box>

        {canCreate ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingField(null);
              setDialogOpen(true);
            }}
          >
            Create Field
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
          <TextField
            fullWidth
            size="small"
            label="Search fields"
            placeholder="Search by key, name, label or type"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            sx={{ mb: 2 }}
          />

          <FormFieldTable
            rows={filteredFields}
            loading={loading}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canRestore={canRestore}
            canEnable={canEnable}
            canDisable={canDisable}
            onEdit={(field) => {
              setEditingField(field);
              setDialogOpen(true);
            }}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onEnable={handleEnable}
            onDisable={handleDisable}
          />
        </CardContent>
      </Card>

      <FormFieldDialog
        open={dialogOpen}
        field={editingField}
        submitting={submitting}
        error={error}
        onClose={() => {
          setDialogOpen(false);
          setEditingField(null);
          setError("");
        }}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}