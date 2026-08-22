import ApiResponse from "../../helpers/ApiResponse.js";

import contactService from "./contact.service.js";

import {
    CONTACT_MESSAGES,
} from "./contact.constant.js";

async function getContactByMobile(
    req,
    res,
    next,
) {
    try {
        const contact =
            await contactService.getContactByMobile(
                req.params.organizationId,
                req.params.mobile,
            );

        return ApiResponse.success(
            res,
            contact,
            CONTACT_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getContactByMobile,
});