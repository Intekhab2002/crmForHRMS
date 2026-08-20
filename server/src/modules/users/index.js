/**
 * ============================================================================
 * CRM for HRMS
 * User Management Module
 * ============================================================================
 */

import userConstants from "./user.constants.js";
import userRepository from "./user.repository.js";
import userService from "./user.service.js";
import userController from "./user.controller.js";
import userValidator from "./user.validator.js";

const userModule = Object.freeze({
    constants: userConstants,
    repository: userRepository,
    service: userService,
    controller: userController,
    validator: userValidator,
});

export default userModule;