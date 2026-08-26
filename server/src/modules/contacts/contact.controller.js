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

export default Object.freeze({
  getContactByMobile,
});
