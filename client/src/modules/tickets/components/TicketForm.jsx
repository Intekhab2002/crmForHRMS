import { useEffect, useMemo, useState } from "react";
import { Formik } from "formik";
import { useAuth } from "../../../context/useAuth";
import {
  TICKET_FORM_CONFIG,
  TICKET_FIELD_MAP,
} from "../../../config/ticket.config";
import TicketFormContent from "./TicketFormContent";
import {
  getOptionSource,
  buildInitialValues,
  buildValidationSchema,
} from "../utils/ticketForm.utils";


export default function TicketForm({
  mode = "create",
  initialValues,
  onSubmit,
  submitting = false,
  submitLabel,
  onCancel,
}) {
  const { user } = useAuth();
  const fields = TICKET_FORM_CONFIG[mode].fields;

  const [options, setOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState({});

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      const optionFields = fields.filter(
        (field) => field.type === "select" || field.type === "autocomplete",
      );

      const results = await Promise.all(
        optionFields.map(async (field) => {
          setLoadingOptions((current) => ({
            ...current,
            [field.key]: true,
          }));

          try {
            return [field.key, await getOptionSource(field, user)];
          } catch (error) {
            console.error(
              `Failed to load options for field "${field.key}"`,
              error,
            );

            return [field.key, []];
          } finally {
            if (active) {
              setLoadingOptions((current) => ({
                ...current,
                [field.key]: false,
              }));
            }
          }
        }),
      );

      if (active) {
        setOptions(Object.fromEntries(results));
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [fields, user]);

  const formInitialValues = useMemo(
    () => buildInitialValues(fields, initialValues, user, options),
    [fields, initialValues, user, options],
  );

  const validationSchema = useMemo(
    () => buildValidationSchema(fields),
    [fields],
  );

  return (
    <Formik
      enableReinitialize
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={(values, formikHelpers) => {
        const normalizedValues = {
          ...values,
          current_bill_status:
            values.current_bill_status === ""
              ? null
              : values.current_bill_status,
          issue_category:
            values.issue_category === "" ? null : values.issue_category,
        };

        return onSubmit(normalizedValues, formikHelpers);
      }}
    >
      {(formik) => {
        return (
          <TicketFormContent
            mode={mode}
            formik={formik}
            fields={fields}
            options={options}
            loadingOptions={loadingOptions}
            submitting={submitting}
            submitLabel={submitLabel ?? TICKET_FORM_CONFIG[mode].submitLabel}
            onCancel={onCancel}
          />
        );
      }}
    </Formik>
  );
}

export { TICKET_FIELD_MAP };
