import organizationRoutes from "./organization.routes.js";
import organizationController from "./organization.controller.js";
import organizationService from "./organization.service.js";
import organizationRepository from "./organization.repository.js";
import organizationValidator from "./organization.validator.js";

export default Object.freeze({
    routes: organizationRoutes,
    controller: organizationController,
    service: organizationService,
    repository: organizationRepository,
    validator: organizationValidator,
});
