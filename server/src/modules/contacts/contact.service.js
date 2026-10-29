import AppError from "../../helpers/AppError.js";

import contactRepository from "./contact.repository.js";
import { CONTACT_ERROR_CODES } from "./contact.constant.js";

function normalizeMobile(mobile) {
  return String(mobile ?? "").trim();
}

async function validateDistrict(districtId, tx = null) {
  if (!districtId) {
    return;
  }

  const district = await contactRepository.findActiveDistrictById(
    districtId,
    tx,
  );

  if (!district) {
    throw AppError.badRequest("Invalid or inactive district.", {
      code: CONTACT_ERROR_CODES.INVALID_DISTRICT,
    });
  }
}

async function getContactByMobile(organizationId, mobile, tx = null) {
  const normalizedMobile = normalizeMobile(mobile);

  if (!normalizedMobile) {
    throw AppError.badRequest("Mobile phone is required.");
  }

  return contactRepository.findContactByMobile(
    organizationId,
    normalizedMobile,
    tx,
  );
}

async function findOrCreateContact(data, tx = null) {
  const normalizedMobile = normalizeMobile(data.mobile);

  await validateDistrict(data.district, tx);
  const existingContact = await contactRepository.findContactByMobile(
    data.organizationId,
    normalizedMobile,
    tx,
  );

  if (existingContact) {
    if (!existingContact.isActive) {
      throw AppError.conflict(
        "A contact with this mobile number exists but is inactive. Reactivate the existing contact before creating a ticket.",
        {
          code: CONTACT_ERROR_CODES.INACTIVE,
        },
      );
    }

    await contactRepository.updateContact(
      existingContact.id,
      {
        name: data.name,
        email: data.email,
        district: data.district,
        departmentId: data.departmentId,
      },
      tx,
    );

    return contactRepository.findContactById(existingContact.id, tx);
  }

  try {
    return await contactRepository.createContact(
      {
        organizationId: data.organizationId,
        name: data.name,
        mobile: normalizedMobile,
        email: data.email,
        district: data.district,
        departmentId: data.departmentId,
      },
      tx,
    );
  } catch (error) {
    if (error?.code === "23505") {
      const contact = await contactRepository.findContactByMobile(
        data.organizationId,
        normalizedMobile,
        tx,
      );

      if (contact) {
        return contact;
      }
    }

    throw error;
  }
}

async function updateContactFromTicket(contactId, data, tx = null) {
  if (!contactId) {
    throw AppError.notFound("Contact not found.", {
      code: CONTACT_ERROR_CODES.NOT_FOUND,
    });
  }

  const contact = await contactRepository.findContactById(contactId, tx);

  if (!contact) {
    throw AppError.notFound("Contact not found.", {
      code: CONTACT_ERROR_CODES.NOT_FOUND,
    });
  }

  await validateDistrict(data.district, tx);

  await contactRepository.updateContact(
    contactId,
    {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      district: data.district,
      departmentId: data.departmentId,
    },
    tx,
  );

  return contactRepository.findContactById(contactId, tx);
}

async function listContacts(query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const result = await contactRepository.findContacts({
    search: query.search,
    organizationId: query.organizationId,
    departmentId: query.departmentId,
    districtId: query.districtId,
    isActive: query.isActive ?? true,
    limit,
    offset: (page - 1) * limit,
  });

  const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / limit);

  return {
    data: result.rows,
    meta: {
      page,
      limit,
      total: result.total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
    },
  };
}

async function getManagedContact(contactId) {
  const contact = await contactRepository.findActiveContactById(contactId);

  if (!contact) {
    throw AppError.notFound("Contact not found or inactive.", {
      code: CONTACT_ERROR_CODES.NOT_FOUND,
    });
  }

  return contact;
}

async function validateContactReferences(data) {
  if (data.organizationId) {
    const organization = await contactRepository.findActiveOrganizationById(
      data.organizationId,
    );

    if (!organization) {
      throw AppError.badRequest("Invalid or inactive organization.");
    }
  }

  if (data.departmentId) {
    const department = await contactRepository.findActiveDepartmentById(
      data.departmentId,
    );

    if (!department) {
      throw AppError.badRequest("Invalid or inactive department.");
    }
  }

  if (data.districtId) {
    await validateDistrict(data.districtId);
  }
}

async function assertMobileAvailable(
  organizationId,
  mobilePhone,
  excludedContactId = null,
) {
  const existing = await contactRepository.findContactByMobile(
    organizationId,
    normalizeMobile(mobilePhone),
  );

  if (existing && existing.id !== excludedContactId) {
    throw AppError.conflict(
      "An active contact with this mobile number already exists in the organization.",
      { code: CONTACT_ERROR_CODES.ALREADY_EXISTS },
    );
  }
}

async function createManagedContact(data) {
  await validateContactReferences(data);

  await assertMobileAvailable(data.organizationId, data.mobilePhone);

  try {
    return await contactRepository.createContact({
      organizationId: data.organizationId,
      departmentId: data.departmentId ?? null,
      district: data.districtId ?? null,
      name: data.name,
      mobile: normalizeMobile(data.mobilePhone),
      email: data.email ?? null,
    });
  } catch (error) {
    if (error?.code === "23505") {
      throw AppError.conflict(
        "A contact with this mobile number already exists in the organization.",
        { code: CONTACT_ERROR_CODES.ALREADY_EXISTS, cause: error },
      );
    }

    throw error;
  }
}

async function updateManagedContact(contactId, data) {
  const current = await getManagedContact(contactId);

  await validateContactReferences(data);

  const organizationId = data.organizationId ?? current.organizationId;
  const mobilePhone = data.mobilePhone ?? current.mobilePhone;

  if (data.organizationId !== undefined || data.mobilePhone !== undefined) {
    await assertMobileAvailable(organizationId, mobilePhone, contactId);
  }

  try {
    const updated = await contactRepository.updateManagedContact(
      contactId,
      data,
    );

    if (!updated) {
      throw AppError.notFound("Contact not found or inactive.", {
        code: CONTACT_ERROR_CODES.NOT_FOUND,
      });
    }

    return updated;
  } catch (error) {
    if (error?.code === "23505") {
      throw AppError.conflict(
        "A contact with this mobile number already exists in the organization.",
        { code: CONTACT_ERROR_CODES.ALREADY_EXISTS, cause: error },
      );
    }

    throw error;
  }
}

async function deactivateManagedContact(contactId) {
  await getManagedContact(contactId);

  const contact = await contactRepository.deactivateContact(contactId);

  if (!contact) {
    throw AppError.notFound("Contact not found or already inactive.", {
      code: CONTACT_ERROR_CODES.NOT_FOUND,
    });
  }

  return contact;
}

async function reactivateManagedContact(contactId) {
  const contact = await contactRepository.findContactById(contactId);

  if (!contact) {
    throw AppError.notFound("Contact not found.", {
      code: CONTACT_ERROR_CODES.NOT_FOUND,
    });
  }

  // Make repeated requests safe.
  if (contact.isActive) {
    return contact;
  }

  // Prevent restoring a contact whose required master records
  // are no longer valid or active.
  try {
    await validateContactReferences({
      organizationId: contact.organizationId,
      departmentId: contact.departmentId,
      districtId: contact.district?.id ?? null,
    });

    return await contactRepository.reactivateContact(contactId);
  } catch (error) {
    if (error?.code === "23505") {
      throw AppError.conflict(
        "This contact cannot be reactivated because its mobile number conflicts with another contact.",
        {
          code: CONTACT_ERROR_CODES.RESTORE_CONFLICT,
          cause: error,
        },
      );
    }

    throw error;
  }
}

export default Object.freeze({
  getContactByMobile,
  findOrCreateContact,
  updateContactFromTicket,

  listContacts,
  getManagedContact,
  createManagedContact,
  updateManagedContact,
  deactivateManagedContact,
  reactivateManagedContact,
});
