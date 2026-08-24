import ApiResponse from "../../helpers/ApiResponse.js";

import service from "./formConfiguration.service.js";
import mapper from "./formConfiguration.mapper.js";

async function getFields(request, response, next) {
    try {
        const result = await service.listFields(request.validatedQuery);

        return ApiResponse.paginated(
            response,
            result.data.map(mapper.mapFieldToApi),
            result.pagination,
            "Form fields retrieved successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function getFieldById(request, response, next) {
    try {
        const field = await service.getFieldById(request.params.fieldId);

        return ApiResponse.success(
            response,
            mapper.mapFieldToApi(field),
            "Form field retrieved successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function createField(request, response, next) {
    try {
        const field = await service.createField(
            request.body,
            request.auth.userId,
        );

        return ApiResponse.created(
            response,
            mapper.mapFieldToApi(field),
            "Form field created successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function updateField(request, response, next) {
    try {
        const field = await service.updateField(
            request.params.fieldId,
            request.body,
            request.auth.userId,
        );

        return ApiResponse.updated(
            response,
            mapper.mapFieldToApi(field),
            "Form field updated successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function disableField(request, response, next) {
    try {
        const field = await service.disableField(
            request.params.fieldId,
            request.auth.userId,
        );

        return ApiResponse.updated(
            response,
            mapper.mapFieldToApi(field),
            "Form field disabled successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function enableField(request, response, next) {
    try {
        const field = await service.enableField(
            request.params.fieldId,
            request.auth.userId,
        );

        return ApiResponse.updated(
            response,
            mapper.mapFieldToApi(field),
            "Form field enabled successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteField(request, response, next) {
    try {
        const field = await service.deleteField(
            request.params.fieldId,
            request.auth.userId,
        );

        return ApiResponse.deleted(
            response,
            mapper.mapFieldToApi(field),
            "Form field deleted successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function restoreField(request, response, next) {
    try {
        const field = await service.restoreField(
            request.params.fieldId,
            request.auth.userId,
        );

        return ApiResponse.updated(
            response,
            mapper.mapFieldToApi(field),
            "Form field restored successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

function runtimeResponse(result) {
    return result.runtime ?? mapper.mapRuntimeForm(
        result.form,
        result.assignments,
    );
}

async function getRuntimeForm(request, response, next) {
    try {
        const result = await service.getRuntimeForm(
            request.params.formCode,
        );

        return ApiResponse.success(
            response,
            runtimeResponse(result),
            "Form configuration retrieved successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function getForms(request, response, next) {
    try {
        const result = await service.listForms(request.validatedQuery);

        return ApiResponse.paginated(
            response,
            result.data.map(mapper.mapFormToApi),
            result.pagination,
            "Forms retrieved successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function getFormByIdentifier(request, response, next) {
    try {
        const result = await service.getFormByIdentifier(
            request.params.identifier,
        );

        if (result.mode === "runtime") {
            return ApiResponse.success(
                response,
                runtimeResponse(result),
                "Form configuration retrieved successfully.",
            );
        }

        return ApiResponse.success(
            response,
            {
                ...mapper.mapFormToApi(result.form),
                fields: result.assignments.map(
                    mapper.mapAssignmentToApi,
                ),
            },
            "Form definition retrieved successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function createForm(request, response, next) {
    try {
        const form = await service.createForm(
            request.body,
            request.auth.userId,
        );

        return ApiResponse.created(
            response,
            mapper.mapFormToApi(form),
            "Form definition created successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function updateForm(request, response, next) {
    try {
        const form = await service.updateForm(
            request.params.formId,
            request.body,
            request.auth.userId,
        );

        return ApiResponse.updated(
            response,
            mapper.mapFormToApi(form),
            "Form definition updated successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function deleteForm(request, response, next) {
    try {
        const form = await service.deleteForm(
            request.params.formId,
            request.auth.userId,
        );

        return ApiResponse.deleted(
            response,
            mapper.mapFormToApi(form),
            "Form definition deleted successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function assignField(request, response, next) {
    try {
        const assignment = await service.assignField(
            request.params.formId,
            request.body.fieldId,
            request.body,
            request.auth.userId,
        );

        return ApiResponse.created(
            response,
            mapper.mapAssignmentToApi(assignment),
            "Form field assigned successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

async function removeField(request, response, next) {
    try {
        await service.removeField(
            request.params.formId,
            request.params.fieldId,
        );

        return ApiResponse.deleted(
            response,
            null,
            "Form field assignment removed successfully.",
        );
    } catch (error) {
        return next(error);
    }
}
async function updateAssignment(request, response, next) {
    try {
        const assignment = await service.updateAssignment(
            request.params.formId,
            request.params.fieldId,
            request.body,
            request.auth.userId,
        );

        return ApiResponse.success(
            response,
            mapper.mapAssignmentToApi(assignment),
            "Form field assignment updated successfully.",
        );
    } catch (error) {
        return next(error);
    }
}

export default Object.freeze({
    getFields,
    getFieldById,
    createField,
    updateField,
    disableField,
    deleteField,
    restoreField,
    enableField,
    getForms,
    getFormByIdentifier,
    getRuntimeForm,
    createForm,
    updateForm,
    deleteForm,
    assignField,
    removeField,
    updateAssignment,
});
