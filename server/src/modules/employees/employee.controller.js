import ApiResponse from "../../helpers/ApiResponse.js";
import employeeService from "./employee.service.js";
import { EMPLOYEE_MESSAGES } from "./employee.constants.js";

async function getEmployees(req, res, next) {
    try {
        const result = await employeeService.listEmployees(req.validatedQuery);
        return ApiResponse.paginated(res, result.data, result.meta, EMPLOYEE_MESSAGES.LIST_SUCCESS);
    } catch (error) { return next(error); }
}

async function getEmployee(req, res, next) {
    try {
        const employee = await employeeService.getEmployee(req.params.employeeId);
        return ApiResponse.success(res, employee, EMPLOYEE_MESSAGES.GET_SUCCESS);
    } catch (error) { return next(error); }
}

async function createEmployee(req, res, next) {
    try {
        const employee = await employeeService.createEmployee(req.body);
        return ApiResponse.created(res, employee, EMPLOYEE_MESSAGES.CREATE_SUCCESS);
    } catch (error) { return next(error); }
}

async function updateEmployee(req, res, next) {
    try {
        const employee = await employeeService.updateEmployee(req.params.employeeId, req.body);
        return ApiResponse.updated(res, employee, EMPLOYEE_MESSAGES.UPDATE_SUCCESS);
    } catch (error) { return next(error); }
}

async function deleteEmployee(req, res, next) {
    try {
        const employee = await employeeService.deactivateEmployee(req.params.employeeId);
        return ApiResponse.deleted(res, employee, EMPLOYEE_MESSAGES.DELETE_SUCCESS);
    } catch (error) { return next(error); }
}

export default Object.freeze({
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
});
