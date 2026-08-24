function getCustomData(ticket) {
  return ticket?.custom_data &&
    typeof ticket.custom_data === "object"
    ? ticket.custom_data
    : {};
}

function getTicketValue(ticket, fieldKey) {
  const customData = getCustomData(ticket);

  const directValues = {
    subject: ticket?.subject,
    description: ticket?.description,
    issue_type: ticket?.issue_type,
    priority: ticket?.priority,
    status: ticket?.status,

    department:
      ticket?.department_id ??
      ticket?.department,

    assigned_to:
      ticket?.assigned_user_id ??
      ticket?.assignedUserId,

    requester_user_id:
      ticket?.requester_user_id,

    created_by:
      ticket?.created_by_user_id,

    organization:
      ticket?.organization_id,

    contact:
      ticket?.contact_id,

    resolution:
      ticket?.resolution_note,
  };

  if (
    Object.prototype.hasOwnProperty.call(
      directValues,
      fieldKey,
    )
  ) {
    return directValues[fieldKey] ?? "";
  }

  return customData[fieldKey] ?? "";
}

export function buildTicketRuntimeInitialValues(
  configuration,
  ticket,
) {
  const fields =
    configuration?.fields ?? [];

  return fields.reduce(
    (values, field) => {
      const key =
        field?.key ??
        field?.fieldKey;

      if (!key) {
        return values;
      }

      values[key] =
        getTicketValue(
          ticket,
          key,
        );

      return values;
    },
    {},
  );
}

export function buildTicketRuntimePayload(
  values,
  configuration,
) {
  const fields =
    configuration?.fields ?? [];

  const allowedKeys =
    new Set(
      fields
        .map(
          (field) =>
            field?.key ??
            field?.fieldKey,
        )
        .filter(Boolean),
    );

  return Object.entries(
    values ?? {},
  ).reduce(
    (payload, [key, value]) => {
      if (!allowedKeys.has(key)) {
        return payload;
      }

      payload[key] = value;

      return payload;
    },
    {},
  );
}