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
    if (open) {
      setValues({
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
    }
  }, [open]);

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