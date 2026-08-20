import departmentRoutes from "./department.routes.js";
import departmentController from "./department.controller.js";
import departmentService from "./department.service.js";
import departmentRepository from "./department.repository.js";
import departmentValidator from "./department.validator.js";

export default Object.freeze({
    routes: departmentRoutes,
    controller: departmentController,
    service: departmentService,
    repository: departmentRepository,
    validator: departmentValidator,
});
