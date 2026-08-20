/**
 * CRM for HRMS
 * Permission Management Controller
 */

import ApiResponse from "../../helpers/ApiResponse.js";
import permissionService from "./permission.service.js";
import {
    PERMISSION_MESSAGES,
} from "./permission.constant.js";

async function getPermissions(
    request,
    response,
    next,
) {
    try {
        const result =
            await permissionService.listPermissions(
                request.validatedQuery,
            );

        return ApiResponse.paginated(
            response,
            result.data,
            result.meta,
            PERMISSION_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getPermissionById(
    request,
    response,
    next,
) {
    try {
        const permission =
            await permissionService.getPermissionById(
                request.params.permissionId,
            );

        return ApiResponse.success(
            response,
            permission,
            PERMISSION_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createPermission(
    request,
    response,
    next,
) {
    try {
        const permission =
            await permissionService.createPermission(
                request.body,
            );

        return ApiResponse.created(
            response,
            permission,
            PERMISSION_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updatePermission(
    request,
    response,
    next,
) {
    try {
        const permission =
            await permissionService.updatePermission(
                request.params.permissionId,
                request.body,
            );

        return ApiResponse.updated(
            response,
            permission,
            PERMISSION_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deletePermission(
    request,
    response,
    next,
) {
    try {
        const permission =
            await permissionService.deactivatePermission(
                request.params.permissionId,
            );

        return ApiResponse.deleted(
            response,
            permission,
            PERMISSION_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

const permissionController = Object.freeze({
    getPermissions,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
});

export default permissionController;
