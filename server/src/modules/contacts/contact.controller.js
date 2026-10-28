import ApiResponse from "../../helpers/ApiResponse.js";

import contactService from "./contact.service.js";

import { CONTACT_MESSAGES } from "./contact.constant.js";

async function getContactByMobile(req, res, next) {
  try {
    const { organizationId, mobilePhone } = req.params;

    const contact = await contactService.getContactByMobile(
      organizationId,
      mobilePhone,
    );

    return ApiResponse.success(res, contact, CONTACT_MESSAGES.GET_SUCCESS);
  } catch (error) {
    return next(error);
  }
}

async function listContacts(req, res, next) {
  try {
    const result = await contactService.listContacts(req.validatedQuery);

    return ApiResponse.paginated(
      res,
      result.data,
      result.meta,
      "Contacts retrieved successfully.",
    );
  } catch (error) {
    return next(error);
  }
}

async function getContact(req, res, next) {
  try {
    const contact = await contactService.getManagedContact(
      req.params.contactId,
    );

    return ApiResponse.success(res, contact, "Contact retrieved successfully.");
  } catch (error) {
    return next(error);
  }
}

async function createContact(req, res, next) {
  try {
    const contact = await contactService.createManagedContact(req.body);

    return ApiResponse.created(res, contact, "Contact created successfully.");
  } catch (error) {
    return next(error);
  }
}

async function updateContact(req, res, next) {
  try {
    const contact = await contactService.updateManagedContact(
      req.params.contactId,
      req.body,
    );

    return ApiResponse.updated(res, contact, "Contact updated successfully.");
  } catch (error) {
    return next(error);
  }
}

async function deleteContact(req, res, next) {
  try {
    const contact = await contactService.deactivateManagedContact(
      req.params.contactId,
    );

    return ApiResponse.deleted(
      res,
      contact,
      "Contact deactivated successfully.",
    );
  } catch (error) {
    return next(error);
  }
}

export default Object.freeze({
  getContactByMobile,
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
});
