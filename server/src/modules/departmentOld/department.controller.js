import ApiResponse from "../../helpers/ApiResponse.js";
import departmentService from "./department.service.js";
import {
    DEPARTMENT_MESSAGES,
} from "./department.constant.js";

async function getDepartments(req, res, next) {
    try {
        const result =
            await departmentService.listDepartments(
                req.validatedQuery,
            );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            DEPARTMENT_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getDepartment(req, res, next) {
    try {
        const department =
            await departmentService.getDepartment(
                req.params.departmentId,
            );

        return ApiResponse.success(
            res,
            department,
            DEPARTMENT_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createDepartment(req, res, next) {
    try {
        const department =
            await departmentService.createDepartment(
                req.body,
            );

        return ApiResponse.created(
            res,
            department,
            DEPARTMENT_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateDepartment(req, res, next) {
    try {
        const department =
            await departmentService.updateDepartment(
                req.params.departmentId,
                req.body,
            );

        return ApiResponse.updated(
            res,
            department,
            DEPARTMENT_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteDepartment(req, res, next) {
    try {
        const department =
            await departmentService.deactivateDepartment(
                req.params.departmentId,
            );

        return ApiResponse.deleted(
            res,
            department,
            DEPARTMENT_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
});
