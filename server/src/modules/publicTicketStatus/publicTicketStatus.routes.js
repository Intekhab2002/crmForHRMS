/**
 * ============================================================================
 * File: publicTicketStatus.routes.js
 * Path: src/modules/publicTicketStatus/publicTicketStatus.routes.js
 * ============================================================================
 */

import { Router } from "express";

import {
  validateBody,
} from "../../middleware/validation.middleware.js";

import publicTicketStatusController from "./publicTicketStatus.controller.js";
import publicTicketStatusValidator from "./publicTicketStatus.validator.js";

const router = Router();

router.post(
  "/",
  validateBody(
    publicTicketStatusValidator
      .publicTicketStatusSearchSchema,
  ),
  publicTicketStatusController
    .searchPublicTicketStatuses,
);

export default router;