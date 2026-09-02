import ApiResponse from "../../helpers/ApiResponse.js";

import serviceTypeService from "./serviceType.service.js";

import {
    SERVICE_TYPE_MESSAGES,
} from "./serviceType.constant.js";

async function getServiceTypes(
    req,
    res,
    next,
) {
    try {
        const result =
            await serviceTypeService
                .listServiceTypes(
                    req.validatedQuery,
                );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            SERVICE_TYPE_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getServiceType(
    req,
    res,
    next,
) {
    try {
        const serviceType =
            await serviceTypeService
                .getServiceType(
                    req.params.serviceTypeId,
                );

        return ApiResponse.success(
            res,
            serviceType,
            SERVICE_TYPE_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createServiceType(
    req,
    res,
    next,
) {
    try {
        const serviceType =
            await serviceTypeService
                .createServiceType(
                    req.body,
                );

        return ApiResponse.created(
            res,
            serviceType,
            SERVICE_TYPE_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateServiceType(
    req,
    res,
    next,
) {
    try {
        const serviceType =
            await serviceTypeService
                .updateServiceType(
                    req.params.serviceTypeId,
                    req.body,
                );

        return ApiResponse.updated(
            res,
            serviceType,
            SERVICE_TYPE_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteServiceType(
    req,
    res,
    next,
) {
    try {
        const serviceType =
            await serviceTypeService
                .deactivateServiceType(
                    req.params.serviceTypeId,
                );

        return ApiResponse.deleted(
            res,
            serviceType,
            SERVICE_TYPE_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getServiceTypes,
    getServiceType,
    createServiceType,
    updateServiceType,
    deleteServiceType,
});