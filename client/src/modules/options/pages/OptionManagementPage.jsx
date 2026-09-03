import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Button,
    Card,
    CardContent,
    Chip,
    MenuItem,
    Stack,
    TextField,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";

import PageHeader from "../../../components/page/PageHeader";
import ConfirmationDialog from "../../../components/feedback/ConfirmationDialog";
import CanAccess from "../../../components/rbac/CanAccess";

import {
    useNotification,
} from "../../../components/feedback/NotificationProvider";

import { useAuth } from "../../../context/useAuth";

import {
    PERMISSIONS,
} from "../../../config/permission.config";

import OptionTypeSelector from "../components/OptionTypeSelector";
import OptionTable from "../components/OptionTable";
import OptionFormDialog from "../components/OptionFormDialog";

import {
    getOptionConfig,
} from "../options.config";

import {
    optionService,
} from "../services/option.service";

const DEFAULT_PAGE_SIZE = 20;

const EMPTY_PAGINATION =
    Object.freeze({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });

function getErrorMessage(error) {
    return (
        error?.response?.data
            ?.message ??
        error?.response?.data
            ?.error?.message ??
        error?.message ??
        "Unable to complete the request."
    );
}

export default function OptionManagementPage() {
    const {
        hasPermission,
    } = useAuth();

    const {
        success,
        error: showError,
    } = useNotification();

    const canRead =
        hasPermission(
            PERMISSIONS.OPTION_READ,
        );

    const canCreate =
        hasPermission(
            PERMISSIONS.OPTION_CREATE,
        );

    const canUpdate =
        hasPermission(
            PERMISSIONS.OPTION_UPDATE,
        );

    const canDelete =
        hasPermission(
            PERMISSIONS.OPTION_DELETE,
        );

    const [
        selectedType,
        setSelectedType,
    ] = useState(
        "serviceTypes",
    );

    const [
        options,
        setOptions,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        searchInput,
        setSearchInput,
    ] = useState("");

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("all");

    const [
        pagination,
        setPagination,
    ] = useState(
        EMPTY_PAGINATION,
    );

    const [
        paginationModel,
        setPaginationModel,
    ] = useState({
        page: 0,
        pageSize:
            DEFAULT_PAGE_SIZE,
    });

    const [
        formOpen,
        setFormOpen,
    ] = useState(false);

    const [
        editingOption,
        setEditingOption,
    ] = useState(null);

    const [
        disablingOption,
        setDisablingOption,
    ] = useState(null);

    const optionConfig =
        useMemo(
            () =>
                getOptionConfig(
                    selectedType,
                ),
            [selectedType],
        );

    const loadOptions =
        useCallback(
            async () => {
                if (
                    !canRead ||
                    !optionConfig
                ) {
                    setOptions([]);
                    setLoading(false);
                    return;
                }

                setLoading(true);

                try {
                    const result =
                        await optionService.list(
                            {
                                endpoint:
                                    optionConfig.endpoint,

                                page:
                                    paginationModel.page +
                                    1,

                                limit:
                                    paginationModel.pageSize,

                                search,

                                isActive:
                                    statusFilter ===
                                    "all"
                                        ? undefined
                                        : statusFilter ===
                                            "active",
                            },
                        );

                    setOptions(
                        result.data,
                    );

                    setPagination(
                        result.pagination,
                    );
                } catch (
                    requestError
                ) {
                    setOptions([]);

                    showError(
                        getErrorMessage(
                            requestError,
                        ),
                    );
                } finally {
                    setLoading(false);
                }
            },
            [
                canRead,
                optionConfig,
                paginationModel,
                search,
                statusFilter,
                showError,
            ],
        );

    useEffect(() => {
        void loadOptions();
    }, [loadOptions]);

    const handleTypeChange =
        (value) => {
            setSelectedType(
                value,
            );

            setSearchInput("");
            setSearch("");

            setStatusFilter(
                "all",
            );

            setPaginationModel({
                page: 0,
                pageSize:
                    DEFAULT_PAGE_SIZE,
            });
        };

    const handleSearch =
        () => {
            setSearch(
                searchInput.trim(),
            );

            setPaginationModel(
                (current) => ({
                    ...current,
                    page: 0,
                }),
            );
        };

    const handleReset =
        () => {
            setSearchInput("");
            setSearch("");
            setStatusFilter(
                "all",
            );

            setPaginationModel({
                page: 0,
                pageSize:
                    DEFAULT_PAGE_SIZE,
            });
        };

    const handleCreate =
        () => {
            if (
                !canCreate ||
                !optionConfig
            ) {
                return;
            }

            setEditingOption(null);
            setFormOpen(true);
        };

    const handleEdit =
        (option) => {
            if (!canUpdate) {
                return;
            }

            setEditingOption(
                option,
            );
            setFormOpen(true);
        };

    const handleSave =
        async (payload) => {
            if (!optionConfig) {
                return;
            }

            if (editingOption) {
                await optionService.update(
                    optionConfig.endpoint,
                    editingOption.id,
                    payload,
                );

                success(
                    `${optionConfig.singularLabel.slice(
                        0,
                        -1,
                    )} updated successfully.`,
                );
            } else {
                await optionService.create(
                    optionConfig.endpoint,
                    payload,
                );

                success(
                    `${optionConfig.singularLabel.slice(
                        0,
                        -1,
                    )} added successfully.`,
                );
            }

            setFormOpen(false);
            setEditingOption(
                null,
            );

            await loadOptions();
        };

    const handleEnable =
        async (option) => {
            if (
                !canUpdate ||
                !optionConfig
            ) {
                return;
            }

            try {
                await optionService.update(
                    optionConfig.endpoint,
                    option.id,
                    {
                        isActive: true,
                    },
                );

                success(
                    `"${option.name}" enabled successfully.`,
                );

                await loadOptions();
            } catch (
                requestError
            ) {
                showError(
                    getErrorMessage(
                        requestError,
                    ),
                );
            }
        };

    const handleDisable =
        async () => {
            if (
                !canDelete ||
                !optionConfig ||
                !disablingOption
            ) {
                return;
            }

            try {
                await optionService.disable(
                    optionConfig.endpoint,
                    disablingOption.id,
                );

                success(
                    `"${disablingOption.name}" disabled successfully.`,
                );

                setDisablingOption(
                    null,
                );

                await loadOptions();
            } catch (
                requestError
            ) {
                showError(
                    getErrorMessage(
                        requestError,
                    ),
                );
            }
        };

    const activeCount =
        options.filter(
            (option) =>
                option.is_active,
        ).length;

    const inactiveCount =
        options.length -
        activeCount;

    return (
        <Stack spacing={3}>
            <PageHeader
                title="Option Management"
                description="Manage the reusable values used by CRM ticket forms."
                actions={
                    <CanAccess
                        permission={
                            PERMISSIONS.OPTION_CREATE
                        }
                    >
                        <Button
                            variant="contained"
                            startIcon={
                                <AddOutlinedIcon />
                            }
                            onClick={
                                handleCreate
                            }
                        >
                            Add option
                        </Button>
                    </CanAccess>
                }
            />

            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Stack
                            direction={{
                                xs: "column",
                                md: "row",
                            }}
                            spacing={1.5}
                        >
                            <OptionTypeSelector
                                value={
                                    selectedType
                                }
                                onChange={
                                    handleTypeChange
                                }
                            />

                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Status"
                                value={
                                    statusFilter
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setStatusFilter(
                                        event
                                            .target
                                            .value,
                                    );

                                    setPaginationModel(
                                        (
                                            current,
                                        ) => ({
                                            ...current,
                                            page: 0,
                                        }),
                                    );
                                }}
                            >
                                <MenuItem value="all">
                                    All
                                </MenuItem>

                                <MenuItem value="active">
                                    Active
                                </MenuItem>

                                <MenuItem value="inactive">
                                    Inactive
                                </MenuItem>
                            </TextField>
                        </Stack>

                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}
                            spacing={1.5}
                        >
                            <TextField
                                fullWidth
                                size="small"
                                label={`Search ${optionConfig?.label ?? "options"}`}
                                placeholder="Search by code or name"
                                value={
                                    searchInput
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSearchInput(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                onKeyDown={(
                                    event,
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        handleSearch();
                                    }
                                }}
                            />

                            <Button
                                variant="outlined"
                                onClick={
                                    handleSearch
                                }
                            >
                                Search
                            </Button>

                            <Button
                                variant="text"
                                startIcon={
                                    <RestartAltOutlinedIcon />
                                }
                                disabled={
                                    !search &&
                                    !searchInput &&
                                    statusFilter ===
                                        "all"
                                }
                                onClick={
                                    handleReset
                                }
                            >
                                Reset
                            </Button>
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                        >
                            <Chip
                                label={`Total ${pagination.total ?? 0}`}
                                variant="outlined"
                                size="small"
                            />

                            <Chip
                                label={`Loaded active ${activeCount}`}
                                color="success"
                                variant="outlined"
                                size="small"
                            />

                            {inactiveCount >
                            0 ? (
                                <Chip
                                    label={`Loaded inactive ${inactiveCount}`}
                                    variant="outlined"
                                    size="small"
                                />
                            ) : null}
                        </Stack>

                        <OptionTable
                            options={
                                options
                            }
                            loading={
                                loading
                            }
                            pagination={
                                pagination
                            }
                            paginationModel={
                                paginationModel
                            }
                            onPaginationModelChange={
                                setPaginationModel
                            }
                            onEdit={
                                handleEdit
                            }
                            onEnable={
                                handleEnable
                            }
                            onDisable={(
                                option,
                            ) =>
                                setDisablingOption(
                                    option,
                                )
                            }
                            canUpdate={
                                canUpdate
                            }
                            canDelete={
                                canDelete
                            }
                        />
                    </Stack>
                </CardContent>
            </Card>

            <OptionFormDialog
                open={formOpen}
                onClose={() => {
                    setFormOpen(
                        false,
                    );
                    setEditingOption(
                        null,
                    );
                }}
                onSubmit={
                    handleSave
                }
                option={
                    editingOption
                }
                optionLabel={
                    optionConfig?.label ??
                    "Option"
                }
                canEdit={
                    editingOption
                        ? canUpdate
                        : canCreate
                }
            />

            <ConfirmationDialog
                open={
                    Boolean(
                        disablingOption,
                    )
                }
                title="Disable option"
                message={
                    disablingOption
                        ? `Are you sure you want to disable "${disablingOption.name}"? It will no longer be available as an active option in ticket forms.`
                        : ""
                }
                confirmLabel="Disable"
                confirmColor="warning"
                loading={false}
                onCancel={() =>
                    setDisablingOption(
                        null,
                    )
                }
                onConfirm={
                    handleDisable
                }
            />
        </Stack>
    );
}