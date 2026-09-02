import AppError from "../../helpers/AppError.js";

import problemStatementRepository from "./problemStatement.repository.js";

import {
    PROBLEM_STATEMENT_ERROR_CODES,
} from "./problemStatement.constant.js";

async function getProblemStatement(problemStatementId) {
    const problemStatement =
        await problemStatementRepository.findProblemStatementById(
            problemStatementId,
        );

    if (!problemStatement) {
        throw AppError.notFound(
            "Problem statement not found.",
            {
                code:
                    PROBLEM_STATEMENT_ERROR_CODES.NOT_FOUND,
            },
        );
    }

    return problemStatement;
}

async function listproblemStatement(query) {
    const page = query.page;
    const limit = query.limit;

    const result =
        await problemStatementRepository.findproblemStatement({
            search: query.search,
            isActive: query.isActive,
            limit,
            offset: (page - 1) * limit,
        });

    const totalPages =
        result.total === 0
            ? 0
            : Math.ceil(
                result.total / limit,
            );

    return {
        data: result.rows,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages,
            hasNextPage:
                page < totalPages,
            hasPreviousPage:
                page > 1 &&
                totalPages > 0,
        },
    };
}

async function createProblemStatement(data) {
    const existingByCode =
        await problemStatementRepository
            .findProblemStatementByCode(
                data.code,
            );

    if (existingByCode) {
        throw AppError.conflict(
            "A problem statement with this code already exists.",
            {
                code:
                    PROBLEM_STATEMENT_ERROR_CODES.CODE_EXISTS,
            },
        );
    }

    const existingByName =
        await problemStatementRepository
            .findProblemStatementByName(
                data.name,
            );

    if (existingByName) {
        throw AppError.conflict(
            "A problem statement with this name already exists.",
            {
                code:
                    PROBLEM_STATEMENT_ERROR_CODES.NAME_EXISTS,
            },
        );
    }

    try {
        return await problemStatementRepository
            .createProblemStatement(data);
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A problem statement with the supplied code or name already exists.",
                {
                    code:
                        PROBLEM_STATEMENT_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function updateProblemStatement(
    problemStatementId,
    data,
) {

    if (data.code) {
        const duplicate =
            await problemStatementRepository
                .findProblemStatementByCode(
                    data.code,
                );

        if (
            duplicate &&
            duplicate.id !== problemStatementId
        ) {
            throw AppError.conflict(
                "A problem statement with this code already exists.",
                {
                    code:
                        PROBLEM_STATEMENT_ERROR_CODES.CODE_EXISTS,
                },
            );
        }
    }

    if (data.name) {
        const duplicate =
            await problemStatementRepository
                .findProblemStatementByName(
                    data.name,
                );

        if (
            duplicate &&
            duplicate.id !== problemStatementId
        ) {
            throw AppError.conflict(
                "A problem statement with this name already exists.",
                {
                    code:
                        PROBLEM_STATEMENT_ERROR_CODES.NAME_EXISTS,
                },
            );
        }
    }

    try {
        return await problemStatementRepository
            .updateProblemStatement(
                problemStatementId,
                data,
            );
    } catch (error) {
        if (error?.code === "23505") {
            throw AppError.conflict(
                "A problem statement with the supplied code or name already exists.",
                {
                    code:
                        PROBLEM_STATEMENT_ERROR_CODES.ALREADY_EXISTS,
                    cause: error,
                },
            );
        }

        throw error;
    }
}

async function deactivateProblemStatement(
    problemStatementId,
) {
    const existing =
        await getProblemStatement(
            problemStatementId,
        );

    if (!existing.is_active) {
        return existing;
    }

    return problemStatementRepository
        .deactivateProblemStatement(
            problemStatementId,
        );
}

export default Object.freeze({
    listproblemStatement,
    getProblemStatement,
    createProblemStatement,
    updateProblemStatement,
    deactivateProblemStatement,
});