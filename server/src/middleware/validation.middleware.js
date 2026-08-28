/**
 * ============================================================================
 * CRM for HRMS
 * Request Validation Middleware
 * ============================================================================
 *
 * Responsibilities:
 * - Validate request body.
 * - Validate route parameters.
 * - Validate query parameters.
 * - Never mutate Express-owned request properties.
 *
 * Validated values are exposed through:
 *     req.validatedBody
 *     req.validatedParams
 *     req.validatedQuery
 * ============================================================================
 */

function createValidator(
    source,
    targetProperty,
) {
    return function validate(
        schema,
    ) {
        return function validationMiddleware(
            request,
            response,
            next,
        ) {
            try {
                request[targetProperty] =
                    schema.parse(
                        request[source],
                    );

                return next();
            } catch (error) {
                return next(error);
            }
        };
    };
}

const validateBody =
    createValidator(
        "body",
        "validatedBody",
    );

const validateParams =
    createValidator(
        "params",
        "validatedParams",
    );

const validateQuery =
    createValidator(
        "query",
        "validatedQuery",
    );

export {
    validateBody,
    validateParams,
    validateQuery,
};

export default Object.freeze({
    validateBody,
    validateParams,
    validateQuery,
});