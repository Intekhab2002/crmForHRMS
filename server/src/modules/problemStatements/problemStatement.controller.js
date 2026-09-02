import ApiResponse from "../../helpers/ApiResponse.js";

import problemStatementService from "./problemStatement.service.js";

import {
    PROBLEM_STATEMENT_MESSAGES,
} from "./problemStatement.constant.js";

async function getproblemStatement(
    req,
    res,
    next,
) {
    try {
        const result =
            await problemStatementService
                .listproblemStatement(
                    req.validatedQuery,
                );

        return ApiResponse.paginated(
            res,
            result.data,
            result.meta,
            PROBLEM_STATEMENT_MESSAGES.LIST_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function getProblemStatement(
    req,
    res,
    next,
) {
    try {
        const problemStatement =
            await problemStatementService
                .getProblemStatement(
                    req.params.problemStatementId,
                );

        return ApiResponse.success(
            res,
            problemStatement,
            PROBLEM_STATEMENT_MESSAGES.GET_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function createProblemStatement(
    req,
    res,
    next,
) {
    try {
        const problemStatement =
            await problemStatementService
                .createProblemStatement(
                    req.body,
                );

        return ApiResponse.created(
            res,
            problemStatement,
            PROBLEM_STATEMENT_MESSAGES.CREATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function updateProblemStatement(
    req,
    res,
    next,
) {
    try {
        const problemStatement =
            await problemStatementService
                .updateProblemStatement(
                    req.params.problemStatementId,
                    req.body,
                );

        return ApiResponse.updated(
            res,
            problemStatement,
            PROBLEM_STATEMENT_MESSAGES.UPDATE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteProblemStatement(
    req,
    res,
    next,
) {
    try {
        const problemStatement =
            await problemStatementService
                .deactivateProblemStatement(
                    req.params.problemStatementId,
                );

        return ApiResponse.deleted(
            res,
            problemStatement,
            PROBLEM_STATEMENT_MESSAGES.DELETE_SUCCESS,
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getproblemStatement,
    getProblemStatement,
    createProblemStatement,
    updateProblemStatement,
    deleteProblemStatement,
});