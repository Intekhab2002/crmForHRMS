import AppError from "../../helpers/AppError.js";

import contactRepository from "./contact.repository.js";

import {
    CONTACT_ERROR_CODES,
} from "./contact.constant.js";

function normalizeMobile(mobile) {
    return mobile.trim();
}

async function getContactByMobile(
    organizationId,
    mobile,
) {
    const normalizedMobile = normalizeMobile(mobile);

    const contact =
        await contactRepository.findContactByMobile(
            organizationId,
            normalizedMobile,
        );

    if (!contact) {
        throw AppError.notFound(
            "Contact not found.",
            {
                code: CONTACT_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return contact;
}

async function findOrCreateContact(
    {
        organizationId,
        name,
        mobile,
    },
    tx = null,
) {
    const normalizedMobile = normalizeMobile(mobile);

    const existingContact =
        await contactRepository.findContactByMobile(
            organizationId,
            normalizedMobile,
            tx,
        );

    if (existingContact) {
        return existingContact;
    }

    try {
        return await contactRepository.createContact(
            {
                organizationId,
                name,
                mobile: normalizedMobile,
            },
            tx,
        );
    } catch (error) {
        /*
         * Another concurrent ticket creation may have created
         * the same contact between our SELECT and INSERT.
         *
         * PostgreSQL unique constraint:
         *
         * organization_id + mobile_phone
         *
         * protects the database from duplicates.
         */
        if (error?.code === "23505") {
            const contact =
                await contactRepository.findContactByMobile(
                    organizationId,
                    normalizedMobile,
                    tx,
                );

            if (contact) {
                return contact;
            }

            throw AppError.conflict(
                "A contact with this mobile number already exists.",
                {
                    code:
                        CONTACT_ERROR_CODES.ALREADY_EXISTS,
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
});