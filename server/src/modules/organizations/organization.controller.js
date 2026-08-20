import ApiResponse from "../../helpers/ApiResponse.js";
import organizationService from "./organization.service.js";
import {
    ORGANIZATION_MESSAGES,
} from "./organization.constant.js";

async function getOrganizations(req, res, next) {
    try {
        const result =
            await organizationService.listOrganizations(
                req.validatedQuery,
            );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            ORGANIZATION_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getOrganization(req, res, next) {
    try {
        const organization =
            await organizationService.getOrganization(
                req.params.organizationId,
            );

        return ApiResponse.success(
            res,
            organization,
            ORGANIZATION_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createOrganization(req, res, next) {
    try {
        const organization =
            await organizationService.createOrganization(
                req.body,
            );

        return ApiResponse.created(
            res,
            organization,
            ORGANIZATION_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateOrganization(req, res, next) {
    try {
        const organization =
            await organizationService.updateOrganization(
                req.params.organizationId,
                req.body,
            );

        return ApiResponse.updated(
            res,
            organization,
            ORGANIZATION_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteOrganization(req, res, next) {
    try {
        const organization =
            await organizationService.deactivateOrganization(
                req.params.organizationId,
            );

        return ApiResponse.deleted(
            res,
            organization,
            ORGANIZATION_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
});
