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


const EMPTY_ASSIGNMENT = {
  fieldId: "",
  isVisible: null,
  isEnabled: null,
  isEditable: null,
  isReadOnly: null,
  isRequired: null,
  isSearchable: null,
  isFilterable: null,
  isSortable: null,

  displayOrder: 0,
  section: "",
  gridSize: null,
  columnWidth: "",

  labelOverride: "",
  placeholderOverride: "",
  helpTextOverride: "",
  defaultValueOverride: null,
};

export default function FieldAssignmentDialog({
  open,
  fields,
  assignment = null,
  submitting,
  error,
  onClose,
  onSubmit,
}) {
  const [
    values,
    setValues,
  ] = useState({
    fieldId: "",
    displayOrder: 0,
    section: "",
    gridSize: 12,
    isVisible: true,
    isEnabled: true,
    isEditable: true,
    isReadOnly: false,
    isRequired: false,
  });

useEffect(() => {
  if (!open) {
    return;
  }

  if (assignment) {
    setValues({
      fieldId: assignment.fieldId ?? "",
      isVisible: assignment.isVisible ?? null,
      isEnabled: assignment.isEnabled ?? null,
      isEditable: assignment.isEditable ?? null,
      isReadOnly: assignment.isReadOnly ?? null,
      isRequired: assignment.isRequired ?? null,
      isSearchable: assignment.isSearchable ?? null,
      isFilterable: assignment.isFilterable ?? null,
      isSortable: assignment.isSortable ?? null,

      displayOrder: assignment.displayOrder ?? 0,
      section: assignment.section ?? "",
      gridSize: assignment.gridSize ?? null,
      columnWidth: assignment.columnWidth ?? "",

      labelOverride: assignment.labelOverride ?? "",
      placeholderOverride:
        assignment.placeholderOverride ?? "",
      helpTextOverride:
        assignment.helpTextOverride ?? "",
      defaultValueOverride:
        assignment.defaultValueOverride ?? null,
    });

    return;
  }

  setValues(EMPTY_ASSIGNMENT);
}, [open, assignment]);

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

    if (!values.fieldId) {
      return;
    }

    onSubmit({
      ...values,
      displayOrder:
        Number(values.displayOrder),
      gridSize:
        Number(values.gridSize),
    });
  }


  function OverrideSelect({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <TextField
      fullWidth
      select
      label={label}
      name={name}
      value={
        value === null
          ? "inherit"
          : String(value)
      }
      onChange={(event) => {
        const nextValue = event.target.value;

        onChange({
          target: {
            name,
            value:
              nextValue === "inherit"
                ? null
                : nextValue === "true",
          },
        });
      }}
    >
      <MenuItem value="inherit">
        Inherit
      </MenuItem>

      <MenuItem value="true">
        Yes
      </MenuItem>

      <MenuItem value="false">
        No
      </MenuItem>
    </TextField>
  );
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
      maxWidth="sm"
    >
      <DialogTitle>
        Assign Field
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
          <Grid size={12}>
            <TextField
              fullWidth
              required
              select
              label="Field"
              name="fieldId"
              value={values.fieldId}
              onChange={handleChange}
            >
              {fields.map(
                (field) => (
                  <MenuItem
                    key={field.id}
                    value={field.id}
                  >
                    {field.label} (
                    {field.fieldKey})
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
              type="number"
              label="Display Order"
              name="displayOrder"
              value={
                values.displayOrder
              }
              onChange={handleChange}
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
              type="number"
              label="Grid Size"
              name="gridSize"
              value={
                values.gridSize
              }
              onChange={handleChange}
              inputProps={{
                min: 1,
                max: 12,
              }}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Section"
              name="section"
              value={values.section}
              onChange={handleChange}
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
          disabled={
            submitting ||
            !values.fieldId
          }
        >
          {submitting
            ? "Assigning..."
            : "Assign Field"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}