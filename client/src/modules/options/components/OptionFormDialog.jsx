import { useFormik } from "formik";

import {
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
} from "@mui/material";

import FormTextField from "../../../components/forms/FormTextField";
import FormSubmitButton from "../../../components/forms/FormSubmitButton";

function getInitialValues(option) {
    return {
        code:
            option?.code ?? "",
        name:
            option?.name ?? "",
        description:
            option?.description ?? "",
        displayOrder:
            option?.display_order ??
            option?.displayOrder ??
            0,
    };
}

export default function OptionFormDialog({
    open,
    onClose,
    onSubmit,
    option = null,
    optionLabel,
    canEdit = true,
}) {
    const isEdit =
        Boolean(option);

    const formik = useFormik({
        enableReinitialize: true,

        initialValues:
            getInitialValues(option),

        validate: (values) => {
            const errors = {};

            if (!isEdit) {
                const code =
                    values.code.trim();

                if (!code) {
                    errors.code =
                        "Code is required.";
                } else if (
                    !/^[A-Z][A-Z0-9_-]*$/.test(
                        code,
                    )
                ) {
                    errors.code =
                        "Use uppercase letters, numbers, underscores or hyphens. Code must start with a letter.";
                }
            }

            if (!values.name.trim()) {
                errors.name =
                    "Name is required.";
            }

            if (
                values.displayOrder ===
                    "" ||
                Number.isNaN(
                    Number(
                        values.displayOrder,
                    ),
                ) ||
                Number(
                    values.displayOrder,
                ) < 0
            ) {
                errors.displayOrder =
                    "Display order must be zero or greater.";
            }

            return errors;
        },

        onSubmit: async (
            values,
            helpers,
        ) => {
            try {
                const payload = {
                    name:
                        values.name.trim(),

                    description:
                        values.description.trim() ||
                        null,

                    displayOrder:
                        Number(
                            values.displayOrder,
                        ),
                };

                if (!isEdit) {
                    payload.code =
                        values.code
                            .trim()
                            .toUpperCase();
                }

                await onSubmit(payload);

                helpers.resetForm();
            } catch (error) {
                helpers.setStatus(
                    error?.response?.data
                        ?.message ??
                        error?.message ??
                        "Unable to save option.",
                );
            }
        },
    });

    return (
        <Dialog
            open={open}
            onClose={
                formik.isSubmitting
                    ? undefined
                    : onClose
            }
            fullWidth
            maxWidth="sm"
            aria-labelledby="option-form-title"
        >
            <form
                onSubmit={
                    formik.handleSubmit
                }
                noValidate
            >
                <DialogTitle id="option-form-title">
                    {isEdit
                        ? `Edit ${optionLabel}`
                        : `Add ${optionLabel}`}
                </DialogTitle>

                <DialogContent dividers>
                    <Stack
                        spacing={2.5}
                        sx={{ pt: 1 }}
                    >
                        {formik.status ? (
                            <Alert severity="error">
                                {
                                    formik.status
                                }
                            </Alert>
                        ) : null}

                        <FormTextField
                            field={{
                                name: "code",
                                label: "Code",
                                required: !isEdit,
                                helperText:
                                    isEdit
                                        ? "Option codes cannot be changed after creation."
                                        : "Uppercase letters, numbers, underscores and hyphens.",
                            }}
                            formik={formik}
                            disabled={
                                isEdit ||
                                !canEdit ||
                                formik.isSubmitting
                            }
                            inputProps={{
                                maxLength: 100,
                            }}
                        />

                        <FormTextField
                            field={{
                                name: "name",
                                label: "Name",
                                required: true,
                            }}
                            formik={formik}
                            disabled={
                                !canEdit ||
                                formik.isSubmitting
                            }
                            inputProps={{
                                maxLength: 150,
                            }}
                        />

                        <FormTextField
                            field={{
                                name: "description",
                                label: "Description",
                                helperText:
                                    "Optional description.",
                            }}
                            formik={formik}
                            disabled={
                                !canEdit ||
                                formik.isSubmitting
                            }
                            multiline
                            minRows={3}
                            inputProps={{
                                maxLength: 2000,
                            }}
                        />

                        <FormTextField
                            field={{
                                name: "displayOrder",
                                label: "Display order",
                                type: "number",
                                required: true,
                                helperText:
                                    "Lower values appear first.",
                            }}
                            formik={formik}
                            disabled={
                                !canEdit ||
                                formik.isSubmitting
                            }
                            inputProps={{
                                min: 0,
                                step: 1,
                            }}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2,
                    }}
                >
                    <FormSubmitButton
                        variant="contained"
                        loading={
                            formik.isSubmitting
                        }
                        disabled={!canEdit}
                    >
                        {isEdit
                            ? "Save changes"
                            : "Add option"}
                    </FormSubmitButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}