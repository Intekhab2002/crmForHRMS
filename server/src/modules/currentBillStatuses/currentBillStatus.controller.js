import ApiResponse from "../../helpers/ApiResponse.js";

import currentBillStatusService from "./currentBillStatus.service.js";

import {
    CURRENT_BILL_STATUS_MESSAGES,
} from "./currentBillStatus.constant.js";

async function getcurrentBillStatus(
    req,
    res,
    next,
) {
    try {
        const result =
            await currentBillStatusService
                .listcurrentBillStatus(
                    req.validatedQuery,
                );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            CURRENT_BILL_STATUS_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getCurrentBillStatus(
    req,
    res,
    next,
) {
    try {
        const currentBillStatus =
            await currentBillStatusService
                .getCurrentBillStatus(
                    req.params.currentBillStatusId,
                );

        return ApiResponse.success(
            res,
            currentBillStatus,
            CURRENT_BILL_STATUS_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createCurrentBillStatus(
    req,
    res,
    next,
) {
    try {
        const currentBillStatus =
            await currentBillStatusService
                .createCurrentBillStatus(
                    req.body,
                );

        return ApiResponse.created(
            res,
            currentBillStatus,
            CURRENT_BILL_STATUS_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateCurrentBillStatus(
    req,
    res,
    next,
) {
    try {
        const currentBillStatus =
            await currentBillStatusService
                .updateCurrentBillStatus(
                    req.params.currentBillStatusId,
                    req.body,
                );

        return ApiResponse.updated(
            res,
            currentBillStatus,
            CURRENT_BILL_STATUS_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteCurrentBillStatus(
    req,
    res,
    next,
) {
    try {
        const currentBillStatus =
            await currentBillStatusService
                .deactivateCurrentBillStatus(
                    req.params.currentBillStatusId,
                );

        return ApiResponse.deleted(
            res,
            currentBillStatus,
            CURRENT_BILL_STATUS_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getcurrentBillStatus,
    getCurrentBillStatus,
    createCurrentBillStatus,
    updateCurrentBillStatus,
    deleteCurrentBillStatus,
});