import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

const FIELD_TYPES = [
  {
    value: "text",
    label: "Text",
  },
  {
    value: "textarea",
    label: "Textarea",
  },
  {
    value: "number",
    label: "Number",
  },
  {
    value: "email",
    label: "Email",
  },
  {
    value: "date",
    label: "Date",
  },
  {
    value: "select",
    label: "Select",
  },
  {
    value: "multiselect",
    label: "Multi Select",
  },
  {
    value: "checkbox",
    label: "Checkbox",
  },
  {
    value: "radio",
    label: "Radio",
  },
];

const EMPTY_VALUES = {
  fieldKey: "",
  name: "",
  label: "",
  description: "",
  type: "text",
  dataType: "string",
  placeholder: "",
  helpText: "",
  defaultValue: "",
  isVisible: true,
  isEnabled: true,
  isEditable: true,
  isReadOnly: false,
  isRequired: false,
  isSearchable: false,
  isFilterable: false,
  isSortable: false,
  validationConfig: {},
  optionsConfig: {},
};

export default function FormFieldDialog({
  open,
  field,
  submitting = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const [
    values,
    setValues,
  ] = useState(EMPTY_VALUES);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (field) {
      setValues({
        ...EMPTY_VALUES,
        ...field,
      });

      return;
    }

    setValues({
      ...EMPTY_VALUES,
    });
  }, [open, field]);

  function handleChange(event) {
    const {
      name,
      value,
      checked,
      type,
    } = event.target;

    setValues(
      (current) => ({
        ...current,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      }),
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      ...values,
      defaultValue:
        values.defaultValue || null,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={
        submitting
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {field
          ? "Edit Form Field"
          : "Create Form Field"}
      </DialogTitle>

      <DialogContent>
        {error ? (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        ) : null}

        <Grid
          container
          spacing={2}
          sx={{ mt: 0.5 }}
        >
          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <TextField
              fullWidth
              required
              label="Field Key"
              name="fieldKey"
              value={
                values.fieldKey
              }
              onChange={
                handleChange
              }
              disabled={Boolean(field)}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <TextField
              fullWidth
              required
              label="Name"
              name="name"
              value={values.name}
              onChange={
                handleChange
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <TextField
              fullWidth
              required
              label="Label"
              name="label"
              value={values.label}
              onChange={
                handleChange
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <TextField
              fullWidth
              select
              label="Field Type"
              name="type"
              value={values.type}
              onChange={
                handleChange
              }
            >
              {FIELD_TYPES.map(
                (option) => (
                  <MenuItem
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </MenuItem>
                ),
              )}
            </TextField>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <TextField
              fullWidth
              label="Data Type"
              name="dataType"
              value={
                values.dataType
              }
              onChange={
                handleChange
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <TextField
              fullWidth
              label="Placeholder"
              name="placeholder"
              value={
                values.placeholder
              }
              onChange={
                handleChange
              }
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              name="description"
              value={
                values.description
              }
              onChange={
                handleChange
              }
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Help Text"
              name="helpText"
              value={
                values.helpText
              }
              onChange={
                handleChange
              }
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Default Value"
              name="defaultValue"
              value={
                values.defaultValue ?? ""
              }
              onChange={
                handleChange
              }
            />
          </Grid>

          <Grid size={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isVisible"
                  checked={
                    values.isVisible
                  }
                  onChange={
                    handleChange
                  }
                />
              }
              label="Visible"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isEnabled"
                  checked={
                    values.isEnabled
                  }
                  onChange={
                    handleChange
                  }
                />
              }
              label="Enabled"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isEditable"
                  checked={
                    values.isEditable
                  }
                  onChange={
                    handleChange
                  }
                />
              }
              label="Editable"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isReadOnly"
                  checked={
                    values.isReadOnly
                  }
                  onChange={
                    handleChange
                  }
                />
              }
              label="Read only"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isRequired"
                  checked={
                    values.isRequired
                  }
                  onChange={
                    handleChange
                  }
                />
              }
              label="Required"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isSearchable"
                  checked={
                    values.isSearchable
                  }
                  onChange={
                    handleChange
                  }
                />
              }
              label="Searchable"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isFilterable"
                  checked={
                    values.isFilterable
                  }
                  onChange={
                    handleChange
                  }
                />
              }
              label="Filterable"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isSortable"
                  checked={
                    values.isSortable
                  }
                  onChange={
                    handleChange
                  }
                />
              }
              label="Sortable"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? "Saving..."
            : field
              ? "Update Field"
              : "Create Field"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}