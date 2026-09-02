/**
 * ============================================================================
 * File: index.js
 * Path: src/routes/index.js
 * ============================================================================
 *
 * Description:
 * Central route registry responsible for composing all application routes.
 *
 * Responsibilities
 * ----------------
 * • Register feature routes.
 * • Apply API versioning.
 * • Export the configured router.
 *
 * The API prefix (e.g. "/api") is intentionally registered in app.js,
 * making this router reusable and independent of deployment configuration.
 *
 * This module intentionally does NOT:
 * • Configure Express.
 * • Register middleware.
 * • Handle errors.
 * • Contain business logic.
 * ============================================================================
 */

import { Router } from "express";

import appConfig from "../config/app.config.js";

import healthRouter from "./health.routes.js";

import authModule from "../modules/auth/index.js";

import userRouter from "../modules/users/user.routes.js";

import roleRouter from "../modules/roles/role.routes.js";

import permissionRouter from "../modules/permissions/permission.routes.js";

import organizationRouter from "../modules/organizations/organization.routes.js";

import departmentRouter from "../modules/departments/department.routes.js";

import ticketRouter from "../modules/tickets/ticket.routes.js";

import contactRouter from "../modules/contacts/contact.routes.js";

import serviceTypeRouter from "../modules/serviceTypes/serviceType.routes.js";

import ticketCategoryRouter from "../modules/ticketCategories/ticketCategory.routes.js";

import districtRouter from "../modules/districts/district.routes.js";

import problemStatementRouter from "../modules/problemStatements/problemStatement.routes.js";

import currentBillStatusRouter from "../modules/currentBillStatuses/currentBillStatus.routes.js";

import ticketStatusRouter from "../modules/ticketStatuses/ticketStatus.routes.js";

import ticketSeverityRouter from "../modules/ticketSeverities/ticketSeverity.routes.js";

import ticketIssueCategoryRouter from "../modules/ticketIssueCategories/ticketIssueCategory.routes.js";

import ticketDependencyCategoryRouter from "../modules/ticketDependencyCategories/ticketDependencyCategory.routes.js";


const router = Router();

/**
 * ============================================================================
 * API Version
 * ============================================================================
 */

const apiVersion = appConfig.http.apiVersion;

/**
 * ============================================================================
 * System Routes
 * ============================================================================
 */

router.use(`/${apiVersion}/health`, healthRouter);

/**
 * ============================================================================
 * Feature Routes
 * ============================================================================
 */

router.use(`/${apiVersion}/auth`, authModule.routes);

router.use(`/${apiVersion}/users`, userRouter);

router.use(`/${apiVersion}/roles`, roleRouter);

router.use(`/${apiVersion}/permissions`, permissionRouter);

router.use(`/${apiVersion}/organizations`, organizationRouter);

router.use(`/${apiVersion}/departments`, departmentRouter);

router.use(`/${apiVersion}/tickets`, ticketRouter);

router.use(`/${apiVersion}/contacts`, contactRouter);

router.use(`/${apiVersion}/serviceTypes`, serviceTypeRouter);

router.use(`/${apiVersion}/ticketCategories`, ticketCategoryRouter);

router.use(`/${apiVersion}/districts`, districtRouter);

router.use(`/${apiVersion}/problemStatements`, problemStatementRouter);

router.use(`/${apiVersion}/currentBillStatuses`, currentBillStatusRouter);

router.use(`/${apiVersion}/ticketStatuses`, ticketStatusRouter);

router.use(`/${apiVersion}/ticketSeverities`, ticketSeverityRouter);

router.use(`/${apiVersion}/ticketIssueCategories`, ticketIssueCategoryRouter);

router.use(`/${apiVersion}/ticketDependencyCategories`, ticketDependencyCategoryRouter);


// router.use(`/${apiVersion}/sla`, slaRouter);

// router.use(`/${apiVersion}/dashboard`, dashboardRouter);

export default router;
