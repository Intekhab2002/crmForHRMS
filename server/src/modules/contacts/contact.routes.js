import { Router } from "express";

import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";

import contactController from "./contact.controller.js";
import contactValidator from "./contact.validator.js";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";

const { authenticate } = authMiddleware;
const { requirePermission } = rbacMiddleware;

const {
  TICKET_CREATE,
  CONTACT_READ,
  CONTACT_CREATE,
  CONTACT_UPDATE,
  CONTACT_DELETE,
} = RBAC_PERMISSIONS;

const router = Router();

// List contacts with server-side search, filtering and pagination.
router.get(
  "/",
  authenticate,
  requirePermission(CONTACT_READ),
  validateQuery(contactValidator.contactListQuerySchema),
  contactController.listContacts,
);

// Preserve the existing ticket workflow: lookup contact by organization/mobile.
router.get(
  "/:organizationId/by-mobile/:mobilePhone",
  authenticate,
  requirePermission(TICKET_CREATE),
  validateParams(contactValidator.mobileLookupParamSchema),
  contactController.getContactByMobile,
);

// Read one contact.
router.get(
  "/:contactId",
  authenticate,
  requirePermission(CONTACT_READ),
  validateParams(contactValidator.contactIdParamSchema),
  contactController.getContact,
);

// Create contact.
router.post(
  "/",
  authenticate,
  requirePermission(CONTACT_CREATE),
  validateBody(contactValidator.createContactSchema),
  contactController.createContact,
);

// Update contact.
router.patch(
  "/:contactId",
  authenticate,
  requirePermission(CONTACT_UPDATE),
  validateParams(contactValidator.contactIdParamSchema),
  validateBody(contactValidator.updateContactSchema),
  contactController.updateContact,
);

// Soft-delete contact. Historical ticket references remain intact.
router.delete(
  "/:contactId",
  authenticate,
  requirePermission(CONTACT_DELETE),
  validateParams(contactValidator.contactIdParamSchema),
  contactController.deleteContact,
);

export default router;