import  { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useAuth } from "../../context/useAuth";

function getDefaultValue(field) {
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.type === "checkbox") return false;
  return "";
}

function buildInitialValues(fields, initialValues) {
  return fields.reduce((values, field) => {
    values[field.name] = initialValues[field.name] ?? getDefaultValue(field);
    return values;
  }, {});
}

function canUseField(field, mode, hasPermission) {
  const permission = field.permissions?.[mode] ?? field.permission;
  return !permission || hasPermission(permission);
}

function validateField(field, value) {
  if (field.required && (value === "" || value === null || value === undefined)) {
    return `${field.label} is required.`;
  }

  if (field.type === "email" && value) {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!isValid) return "Enter a valid email address.";
  }

  if (field.minLength && value.length < field.minLength) {
    return `${field.label} must be at least ${field.minLength} characters.`;
  }

  return "";
}

function renderField(field, value, error, handleChange) {
  if (field.type === "checkbox") {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(value)}
            onChange={(event) => handleChange(field.name, event.target.checked)}
          />
        }
        label={field.label}
      />
    );
  }

  const commonProps = {
    fullWidth: true,
    name: field.name,
    label: field.label,
    value,
    required: field.required,
    placeholder: field.placeholder,
    error: Boolean(error),
    helperText: error || field.helperText,
    onChange: (event) => handleChange(field.name, event.target.value),
  };

  if (field.type === "select") {
    return (
      <TextField {...commonProps} select>
        {(field.options ?? []).map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.type === "textarea") {
    return (
      <TextField
        {...commonProps}
        multiline
        minRows={field.minRows ?? 3}
      />
    );
  }

  if (field.type === "date") {
    return (
      <TextField
        {...commonProps}
        type="date"
        slotProps={{ inputLabel: { shrink: true } }}
      />
    );
  }

  return <TextField {...commonProps} type={field.type ?? "text"} />;
}

export default function ConfigurableForm({
  fields,
  initialValues = {},
  mode = "create",
  submitLabel = "Save",
  submitIcon = <SaveOutlinedIcon />,
  onSubmit,
  disabled = false,
  emptyMessage = "No fields are available for your permissions.",
  secondaryAction = null,
}) {
  const { hasPermission } = useAuth();
  const visibleFields = useMemo(
    () => fields.filter((field) => canUseField(field, mode, hasPermission)),
    [fields, hasPermission, mode],
  );
const initialFormValues = useMemo(
  () => buildInitialValues(visibleFields, initialValues),
  [initialValues, visibleFields],
);

const [values, setValues] = useState(initialFormValues);
const [errors, setErrors] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = visibleFields.reduce((fieldErrors, field) => {
      const error = validateField(field, values[field.name]);
      if (error) fieldErrors[field.name] = error;
      return fieldErrors;
    }, {});

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visibleFields.length) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        {visibleFields.map((field) => (
          <Grid key={field.name} size={field.grid ?? { xs: 12, md: 6 }}>
            {renderField(field, values[field.name], errors[field.name], handleChange)}
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" mt={3}>
        {secondaryAction}
        <Button
          type="submit"
          variant="contained"
          startIcon={submitIcon}
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </Stack>
    </Box>
  );
}
