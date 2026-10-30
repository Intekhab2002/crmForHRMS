import { useEffect, useState } from "react";
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

const EMPTY_FORM = Object.freeze({
  organizationId: "",
  departmentId: "",
  districtId: "",
  name: "",
  mobilePhone: "",
  email: "",
});

function getId(item) {
  return item?.id ?? item?.value ?? "";
}

function getLabel(item) {
  return item?.name ?? item?.label ?? item?.title ?? "";
}

function getInitialValues(contact) {
  return {
    organizationId: contact?.organizationId ?? "",
    departmentId: contact?.departmentId ?? "",
    districtId: contact?.districtId ?? contact?.district?.id ?? "",
    name: contact?.name ?? "",
    mobilePhone: contact?.mobilePhone ?? contact?.mobile_phone ?? "",
    email: contact?.email ?? "",
  };
}

export default function ContactFormDialog({
  open,
  contact = null,
  organizations = [],
  departments = [],
  districts = [],
  saving = false,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(() => getInitialValues(contact));

  const [validationError, setValidationError] = useState("");

  const handleChange = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setValidationError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      organizationId: values.organizationId,
      departmentId: values.departmentId || null,
      districtId: values.districtId || null,
      name: values.name.trim(),
      mobilePhone: values.mobilePhone.trim(),
      email: values.email.trim() || null,
    };

    if (!payload.organizationId) {
      setValidationError("Select an organization.");
      return;
    }
    if (!payload.name) {
      setValidationError("Contact name is required.");
      return;
    }
    if (!payload.mobilePhone) {
      setValidationError("Mobile number is required.");
      return;
    }

    onSubmit(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="contact-form-title"
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="contact-form-title">
          {contact ? "Edit Contact" : "Add Contact"}
        </DialogTitle>

        <DialogContent dividers>
          {validationError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationError}
            </Alert>
          ) : null}

          <Grid container spacing={2} sx={{ pt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                required
                fullWidth
                label="Organization"
                value={values.organizationId}
                onChange={handleChange("organizationId")}
                disabled={saving}
              >
                <MenuItem value="">Select organization</MenuItem>
                {organizations.map((item) => (
                  <MenuItem key={getId(item)} value={getId(item)}>
                    {getLabel(item)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                label="Contact name"
                value={values.name}
                onChange={handleChange("name")}
                inputProps={{ maxLength: 200 }}
                disabled={saving}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                required
                fullWidth
                label="Mobile number"
                value={values.mobilePhone}
                onChange={handleChange("mobilePhone")}
                inputProps={{ maxLength: 30 }}
                disabled={saving}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={values.email}
                onChange={handleChange("email")}
                inputProps={{ maxLength: 320 }}
                disabled={saving}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Department"
                value={values.departmentId}
                onChange={handleChange("departmentId")}
                disabled={saving}
              >
                <MenuItem value="">Not specified</MenuItem>
                {departments.map((item) => (
                  <MenuItem key={getId(item)} value={getId(item)}>
                    {getLabel(item)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="District"
                value={values.districtId}
                onChange={handleChange("districtId")}
                disabled={saving}
              >
                <MenuItem value="">Not specified</MenuItem>
                {districts.map((item) => (
                  <MenuItem key={getId(item)} value={getId(item)}>
                    {getLabel(item)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : contact ? "Save changes" : "Create contact"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
