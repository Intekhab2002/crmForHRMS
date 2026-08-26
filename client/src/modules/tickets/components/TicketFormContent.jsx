function TicketFormContent({
  formik,
  fields,
  options,
  loadingOptions,
  organizationId,
}) {
  const handleContactFound = useCallback(
    (contact) => {
      formik.setFieldValue(
        "name",
        contact.name ?? "",
        false,
      );

      formik.setFieldValue(
        "email_id",
        contact.email ?? "",
        false,
      );

      formik.setFieldValue(
        "district",
        contact.district ?? "",
        false,
      );

      formik.setFieldValue(
        "department",
        contact.department_id ?? "",
        false,
      );
    },
    [formik],
  );

  const handleContactNotFound = useCallback(() => {
    // Normal state.
    // Do not clear fields.
    // Do not mark the form invalid.
  }, []);

  const handleContactError = useCallback((error) => {
    console.error(
      "[TicketForm] Contact lookup failed.",
      error,
    );
  }, []);

  const {
    isLoading: contactLookupLoading,
  } = useContactLookup({
    organizationId,
    mobilePhone: formik.values.mobile_phone,
    onFound: handleContactFound,
    onNotFound: handleContactNotFound,
    onError: handleContactError,
  });

  return (
    <Form noValidate>
      {/* existing form rendering */}
    </Form>
  );
}