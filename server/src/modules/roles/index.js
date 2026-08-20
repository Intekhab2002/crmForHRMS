/**
 * CRM for HRMS - Role Management Module Entry Point
 */

import roleConstants from "./role.constant.js";
import roleRepository from "./role.repository.js";
import roleService from "./role.service.js";
import roleController from "./role.controller.js";
import roleRouter from "./role.routes.js";

export default Object.freeze({
    constants: roleConstants,
    repository: roleRepository,
    service: roleService,
    controller: roleController,
    routes: roleRouter,
});
