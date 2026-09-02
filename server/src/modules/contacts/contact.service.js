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

export default Object.freeze({
  getContactByMobile,
  findOrCreateContact,
  updateContactFromTicket,
});
