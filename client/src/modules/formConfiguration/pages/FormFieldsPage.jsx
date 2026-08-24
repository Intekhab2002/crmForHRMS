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

import { formConfigurationApi } from "../api/formConfiguration.api";
import { FORM_CONFIGURATION_PERMISSIONS } from "../formConfiguration.constants";

import FormFieldTable from "../components/FormFieldTable";
import FormFieldDialog from "../components/FormFieldDialog";

function buildFieldPayload(values) {
  return {
    fieldKey: values.fieldKey,
    name: values.name,
    label: values.label,
    description: values.description ?? null,
    type: values.type,
    dataType: values.dataType,
    placeholder: values.placeholder ?? null,
    helpText: values.helpText ?? null,
    defaultValue: values.defaultValue ?? null,
    status: values.status ?? "active",
    isVisible: Boolean(values.isVisible),
    isEnabled: Boolean(values.isEnabled),
    isEditable: Boolean(values.isEditable),
    isReadOnly: Boolean(values.isReadOnly),
    isRequired: Boolean(values.isRequired),
    isSearchable: Boolean(values.isSearchable),
    isFilterable: Boolean(values.isFilterable),
    isSortable: Boolean(values.isSortable),
    validationConfig: values.validationConfig ?? {},
    optionsConfig: values.optionsConfig ?? {},
    storageType: values.storageType,
    storageColumn: values.storageColumn || null,
    storageKey: values.storageKey || null,
    referenceEntity: values.referenceEntity || null,
  };
}

export default function FormFieldsPage() {
  const { hasPermission } = useAuth();

  const canRead = hasPermission(FORM_CONFIGURATION_PERMISSIONS.FIELD_READ);
  const canCreate = hasPermission(FORM_CONFIGURATION_PERMISSIONS.FIELD_CREATE);
  const canUpdate = hasPermission(FORM_CONFIGURATION_PERMISSIONS.FIELD_UPDATE);
  const canDelete = hasPermission(FORM_CONFIGURATION_PERMISSIONS.FIELD_DELETE);
  const canRestore = hasPermission(FORM_CONFIGURATION_PERMISSIONS.FIELD_RESTORE);
  const canEnable = hasPermission(FORM_CONFIGURATION_PERMISSIONS.FIELD_ENABLE);
  const canDisable = hasPermission(FORM_CONFIGURATION_PERMISSIONS.FIELD_DISABLE);

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadFields = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await formConfigurationApi.listFields({
        page: 1,
        limit: 100,
        ...(status !== "all" ? { status } : {}),
        ...(type !== "all" ? { type } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });

      setFields(response?.data ?? []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
        requestError?.message ??
        "Unable to load form fields.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, type]);

  useEffect(() => {
    if (canRead) void loadFields();
  }, [canRead, loadFields]);

  const filteredFields = useMemo(() => fields, [fields]);

  async function handleSubmit(values) {
    setSubmitting(true);
    setError("");

    try {
      const payload = buildFieldPayload(values);

      if (editingField) {
        await formConfigurationApi.updateField(editingField.id, payload);
      } else {
        await formConfigurationApi.createField(payload);
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

  async function runAction(action, field, fallbackMessage) {
    setError("");

    try {
      await action(field.id);
      await loadFields();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
        requestError?.message ??
        fallbackMessage,
      );
    }
  }

  async function handleDelete(field) {
    if (!window.confirm(
      `Soft delete "${field.label}"? This will not physically remove existing data.`,
    )) {
      return;
    }

    await runAction(
      formConfigurationApi.deleteField,
      field,
      "Unable to delete form field.",
    );
  }

  if (!canRead) {
    return <Alert severity="error">You do not have permission to manage form fields.</Alert>;
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Form Fields
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Configure reusable CRM fields without changing application source code.
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Key, name, label or type"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 160 }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </TextField>

            <TextField
              select
              size="small"
              label="Type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 180 }}
            >
              <option value="all">All</option>
              {[
                "text", "textarea", "number", "email", "select", "multi_select",
                "autocomplete", "date", "datetime", "time", "checkbox", "switch",
                "radio", "file",
              ].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </TextField>
          </Stack>

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
            onRestore={(field) =>
              runAction(formConfigurationApi.restoreField, field, "Unable to restore form field.")
            }
            onEnable={(field) =>
              runAction(formConfigurationApi.enableField, field, "Unable to enable form field.")
            }
            onDisable={(field) =>
              runAction(formConfigurationApi.disableField, field, "Unable to disable form field.")
            }
            onToggleVisibility={(field) =>
              runAction(
                (id) => formConfigurationApi.updateField(id, { isVisible: !field.isVisible }),
                field,
                "Unable to update field visibility.",
              )
            }
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
