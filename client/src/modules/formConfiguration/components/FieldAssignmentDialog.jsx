import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
      value={
        value === null
          ? "inherit"
          : String(value)
      }
      onChange={(event) => {
        const selected = event.target.value;

        onChange(
          name,
          selected === "inherit"
            ? null
            : selected === "true",
        );
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

export default function FieldAssignmentDialog({
  open,
  fields,
  assignment = null,
  submitting,
  error,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(
    EMPTY_ASSIGNMENT,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (assignment) {
      setValues({
        fieldId: assignment.fieldId ?? "",

        isVisible:
          assignment.isVisible ?? null,
        isEnabled:
          assignment.isEnabled ?? null,
        isEditable:
          assignment.isEditable ?? null,
        isReadOnly:
          assignment.isReadOnly ?? null,
        isRequired:
          assignment.isRequired ?? null,
        isSearchable:
          assignment.isSearchable ?? null,
        isFilterable:
          assignment.isFilterable ?? null,
        isSortable:
          assignment.isSortable ?? null,

        displayOrder:
          assignment.displayOrder ?? 0,
        section:
          assignment.section ?? "",
        gridSize:
          assignment.gridSize ?? null,
        columnWidth:
          assignment.columnWidth ?? "",

        labelOverride:
          assignment.labelOverride ?? "",
        placeholderOverride:
          assignment.placeholderOverride ?? "",
        helpTextOverride:
          assignment.helpTextOverride ?? "",
        defaultValueOverride:
          assignment.defaultValueOverride ?? null,
      });

      return;
    }

    setValues({
      ...EMPTY_ASSIGNMENT,
    });
  }, [open, assignment]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleOverrideChange(
    name,
    value,
  ) {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
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
        values.gridSize === null ||
        values.gridSize === ""
          ? null
          : Number(values.gridSize),
    });
  }

  const isEditMode = Boolean(assignment);

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
        {isEditMode
          ? "Edit Field Assignment"
          : "Assign Field"}
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
          {/* Field */}
          <Grid size={12}>
            <TextField
              fullWidth
              required
              select
              label="Field"
              name="fieldId"
              value={values.fieldId}
              onChange={handleChange}
              disabled={isEditMode}
            >
              {fields.map((field) => (
                <MenuItem
                  key={field.id}
                  value={field.id}
                >
                  {field.label} (
                  {field.fieldKey})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Layout */}
          <Grid size={12}>
            <strong>Layout</strong>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 3,
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
              inputProps={{
                min: 0,
              }}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 3,
            }}
          >
            <TextField
              fullWidth
              type="number"
              label="Grid Size"
              name="gridSize"
              value={
                values.gridSize ?? ""
              }
              onChange={handleChange}
              inputProps={{
                min: 1,
                max: 12,
              }}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 3,
            }}
          >
            <TextField
              fullWidth
              label="Section"
              name="section"
              value={values.section}
              onChange={handleChange}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 3,
            }}
          >
            <TextField
              fullWidth
              label="Column Width"
              name="columnWidth"
              value={
                values.columnWidth
              }
              onChange={handleChange}
              placeholder="e.g. 50%"
            />
          </Grid>

          {/* Behavior */}
          <Grid size={12}>
            <strong>Behavior</strong>
          </Grid>

          {[
            [
              "Visible",
              "isVisible",
            ],
            [
              "Enabled",
              "isEnabled",
            ],
            [
              "Editable",
              "isEditable",
            ],
            [
              "Read Only",
              "isReadOnly",
            ],
            [
              "Required",
              "isRequired",
            ],
            [
              "Searchable",
              "isSearchable",
            ],
            [
              "Filterable",
              "isFilterable",
            ],
            [
              "Sortable",
              "isSortable",
            ],
          ].map(
            ([label, name]) => (
              <Grid
                key={name}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <OverrideSelect
                  label={label}
                  name={name}
                  value={values[name]}
                  onChange={
                    handleOverrideChange
                  }
                />
              </Grid>
            ),
          )}

          {/* Overrides */}
          <Grid size={12}>
            <strong>
              Presentation Overrides
            </strong>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <TextField
              fullWidth
              label="Label Override"
              name="labelOverride"
              value={
                values.labelOverride
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
              label="Placeholder Override"
              name="placeholderOverride"
              value={
                values.placeholderOverride
              }
              onChange={handleChange}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Help Text Override"
              name="helpTextOverride"
              value={
                values.helpTextOverride
              }
              onChange={handleChange}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Default Value Override"
              name="defaultValueOverride"
              value={
                values.defaultValueOverride ??
                ""
              }
              onChange={handleChange}
              helperText="Enter a declarative value only. Do not enter JavaScript."
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
            ? "Saving..."
            : isEditMode
              ? "Save Assignment"
              : "Assign Field"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}