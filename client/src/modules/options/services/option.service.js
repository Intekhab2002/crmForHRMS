import apiClient from "../../../services/api/apiClient";

function getPayload(response) {
    return response?.data?.data;
}

function getPagination(response) {
    return response?.data?.meta ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    };
}

export const optionService = Object.freeze({
    async list({
        endpoint,
        page = 1,
        limit = 20,
        search = "",
        isActive,
    }) {
        const response = await apiClient.get(
            endpoint,
            {
                params: {
                    page,
                    limit,
                    search:
                        search?.trim() ||
                        undefined,
                    isActive:
                        typeof isActive === "boolean"
                            ? isActive
                            : undefined,
                },
            },
        );

        return {
            data:
                Array.isArray(
                    getPayload(response),
                )
                    ? getPayload(response)
                    : [],
            pagination:
                getPagination(response),
        };
    },

    async create(endpoint, payload) {
        const response =
            await apiClient.post(
                endpoint,
                payload,
            );

        return getPayload(response);
    },

    async update(
        endpoint,
        optionId,
        payload,
    ) {
        const response =
            await apiClient.patch(
                `${endpoint}/${encodeURIComponent(
                    optionId,
                )}`,
                payload,
            );

        return getPayload(response);
    },

    async disable(
        endpoint,
        optionId,
    ) {
        await apiClient.delete(
            `${endpoint}/${encodeURIComponent(
                optionId,
            )}`,
        );
    },
});