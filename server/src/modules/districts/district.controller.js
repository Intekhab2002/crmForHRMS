import ApiResponse from "../../helpers/ApiResponse.js";

import districtService from "./district.service.js";

import {
    DISTRICT_MESSAGES,
} from "./district.constant.js";

async function getDistricts(
    req,
    res,
    next,
) {
    try {
        const result =
            await districtService
                .listDistricts(
                    req.validatedQuery,
                );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            DISTRICT_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getDistrict(
    req,
    res,
    next,
) {
    try {
        const district =
            await districtService
                .getDistrict(
                    req.params.districtId,
                );

        return ApiResponse.success(
            res,
            district,
            DISTRICT_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createDistrict(
    req,
    res,
    next,
) {
    try {
        const district =
            await districtService
                .createDistrict(
                    req.body,
                );

        return ApiResponse.created(
            res,
            district,
            DISTRICT_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateDistrict(
    req,
    res,
    next,
) {
    try {
        const district =
            await districtService
                .updateDistrict(
                    req.params.districtId,
                    req.body,
                );

        return ApiResponse.updated(
            res,
            district,
            DISTRICT_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteDistrict(
    req,
    res,
    next,
) {
    try {
        const district =
            await districtService
                .deactivateDistrict(
                    req.params.districtId,
                );

        return ApiResponse.deleted(
            res,
            district,
            DISTRICT_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getDistricts,
    getDistrict,
    createDistrict,
    updateDistrict,
    deleteDistrict,
});