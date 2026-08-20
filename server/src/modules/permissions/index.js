/**
 * CRM for HRMS
 * Permission Management Module
 */

import permissionRoutes from "./permission.routes.js";
import permissionController from "./permission.controller.js";
import permissionService from "./permission.service.js";
import permissionRepository from "./permission.repository.js";
import permissionValidator from "./permission.validator.js";

const permissionModule = Object.freeze({
    routes: permissionRoutes,
    controller: permissionController,
    service: permissionService,
    repository: permissionRepository,
    validator: permissionValidator,
});

export default permissionModule;
