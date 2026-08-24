import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { Formik } from "formik";

import { fieldConfigurationSchema } from "../schemas/fieldConfiguration.schema";
import { buildFieldDefaults } from "../utils/fieldDefaults";

import FieldTypeSelector from "./FieldTypeSelector";
import FieldValidationPanel from "./FieldValidationPanel";
import FieldDisplayPanel from "./FieldDisplayPanel";
import FieldOptionsEditor from "./FieldOptionsEditor";
import FieldStoragePanel from "./FieldStoragePanel";
import FieldPreview from "./FieldPreview";

const TABS = Object.freeze([
  "Basic",
  "Behavior",
  "Validation",
  "Display & Layout",
  "Options",
  "Storage / Advanced",
]);

function normalizeDataType(type) {
  const mapping = {
    text: "string",
    textarea: "string",
    number: "number",
    email: "string",
    password: "string",
    select: "string",
    multi_select: "array",
    autocomplete: "string",
    date: "date",
    datetime: "datetime",
    time: "time",
    checkbox: "boolean",
    switch: "boolean",
    radio: "string",
    file: "file",
  };

  return mapping[type] ?? "string";
}

export default function FormFieldDialog({
  open,
  field,
  submitting = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open) setActiveTab(0);
  }, [open, field]);

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>
        {field ? "Edit Form Field" : "Create Form Field"}
      </DialogTitle>

      <Formik
        enableReinitialize
        initialValues={buildFieldDefaults(field)}
        validationSchema={fieldConfigurationSchema}
        onSubmit={(values) => onSubmit({
          ...values,
          defaultValue: values.defaultValue === "" ? null : values.defaultValue,
        })}
      >
        {({
          values,
          errors,
          touched,
          setFieldValue,
          handleChange,
          handleBlur,
          handleSubmit,
        }) => {
          function handleTypeChange(nextType) {
            setFieldValue("type", nextType);
            setFieldValue("dataType", normalizeDataType(nextType));
            setFieldValue("defaultValue", "");
          }

          return (
            <form onSubmit={handleSubmit}>
              <DialogContent dividers>
                {error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                ) : null}

                <Tabs
                  value={activeTab}
                  onChange={(_, next) => setActiveTab(next)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mb: 3 }}
                >
                  {TABS.map((label) => (
                    <Tab key={label} label={label} />
                  ))}
                </Tabs>

                {activeTab === 0 ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        label="Field Key"
                        name="fieldKey"
                        value={values.fieldKey}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={Boolean(field)}
                        error={Boolean(touched.fieldKey && errors.fieldKey)}
                        helperText={touched.fieldKey && errors.fieldKey}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <FieldTypeSelector
                        values={values}
                        setFieldValue={(name, value) => {
                          if (name === "type") handleTypeChange(value);
                          else setFieldValue(name, value);
                        }}
                        errors={errors}
                        touched={touched}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        label="Name"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(touched.name && errors.name)}
                        helperText={touched.name && errors.name}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        label="Label"
                        name="label"
                        value={values.label}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(touched.label && errors.label)}
                        helperText={touched.label && errors.label}
                      />
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Description"
                        name="description"
                        value={values.description ?? ""}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                ) : null}

                {activeTab === 1 ? (
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <FieldDisplayPanel values={values} setFieldValue={setFieldValue} />
                    </Grid>
                    <Grid size={12}>
                      <Divider sx={{ my: 1 }} />
                      <TextField
                        fullWidth
                        label="Default Value"
                        name="defaultValue"
                        value={values.defaultValue ?? ""}
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>
                ) : null}

                {activeTab === 2 ? (
                  <FieldValidationPanel
                    values={values}
                    setFieldValue={setFieldValue}
                  />
                ) : null}

                {activeTab === 3 ? (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <FieldDisplayPanel values={values} setFieldValue={setFieldValue} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <FieldPreview values={values} />
                    </Grid>
                  </Grid>
                ) : null}

                {activeTab === 4 ? (
                  <FieldOptionsEditor
                    values={values}
                    setFieldValue={setFieldValue}
                  />
                ) : null}

                {activeTab === 5 ? (
                  <FieldStoragePanel
                    values={values}
                    setFieldValue={setFieldValue}
                    readOnly={Boolean(field)}
                  />
                ) : null}

                <Box sx={{ mt: 3 }}>
                  <FieldPreview values={values} />
                </Box>

                {Object.keys(errors).length > 0 ? (
                  <Typography color="error" variant="caption" display="block" sx={{ mt: 2 }}>
                    Review the field configuration before saving.
                  </Typography>
                ) : null}
              </DialogContent>

              <DialogActions>
                <Button onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? "Saving..." : field ? "Update Field" : "Create Field"}
                </Button>
              </DialogActions>
            </form>
          );
        }}
      </Formik>
    </Dialog>
  );
}
