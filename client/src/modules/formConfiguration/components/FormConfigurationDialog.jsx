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
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

import { FORM_STATUS_OPTIONS } from "../formConfiguration.constants";
import {
  getFormInitialValues,
} from "../utils/formConfiguration.utils";

export default function FormConfigurationDialog({
  open,
  form = null,
  submitting = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const [
    values,
    setValues,
  ] = useState(
    getFormInitialValues(form),
  );

  useEffect(() => {
    if (open) {
      setValues(
        getFormInitialValues(form),
      );
    }
  }, [open, form]);

  const isEditMode = Boolean(form);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setValues(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit(values);
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
        {isEditMode
          ? "Edit Form"
          : "Create Form"}
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
              label="Form Code"
              name="code"
              value={values.code}
              onChange={handleChange}
              disabled={isEditMode}
              helperText="Example: ticket.create"
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
              label="Form Name"
              name="name"
              value={values.name}
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
              required
              label="Module"
              name="module"
              value={values.module}
              onChange={handleChange}
              helperText="Example: ticket"
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
              label="Status"
              name="status"
              value={values.status}
              onChange={handleChange}
            >
              {FORM_STATUS_OPTIONS.map(
                (option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ),
              )}
            </TextField>
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              name="description"
              value={values.description}
              onChange={handleChange}
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
            : isEditMode
              ? "Update Form"
              : "Create Form"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}