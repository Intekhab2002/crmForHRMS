import {
    Box,
    Chip,
    IconButton,
    Stack,
    Tooltip,
} from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

import { DataGrid } from "@mui/x-data-grid";

function StatusChip({
    active,
}) {
    return (
        <Chip
            size="small"
            label={
                active
                    ? "Active"
                    : "Inactive"
            }
            color={
                active
                    ? "success"
                    : "default"
            }
            variant="outlined"
        />
    );
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "—";
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        },
    );
}

export default function OptionTable({
    options,
    loading,
    pagination,
    paginationModel,
    onPaginationModelChange,
    onEdit,
    onEnable,
    onDisable,
    canUpdate = false,
    canDelete = false,
}) {
    const columns = [
        {
            field: "code",
            headerName: "Code",
            flex: 0.9,
            minWidth: 150,
        },

        {
            field: "name",
            headerName: "Name",
            flex: 1.5,
            minWidth: 200,
        },

        {
            field: "description",
            headerName: "Description",
            flex: 1.7,
            minWidth: 220,

            renderCell: ({
                value,
            }) => (
                <Tooltip
                    title={
                        value ||
                        "No description"
                    }
                >
                    <Box
                        sx={{
                            overflow:
                                "hidden",
                            textOverflow:
                                "ellipsis",
                            whiteSpace:
                                "nowrap",
                            width: "100%",
                        }}
                    >
                        {value ||
                            "—"}
                    </Box>
                </Tooltip>
            ),
        },

        {
            field: "display_order",
            headerName: "Order",
            width: 90,
            align: "center",
            headerAlign: "center",
        },

        {
            field: "is_active",
            headerName: "Status",
            width: 120,

            renderCell: ({
                value,
            }) => (
                <StatusChip
                    active={value}
                />
            ),
        },

        {
            field: "updated_at",
            headerName: "Updated",
            width: 130,

            renderCell: ({
                value,
            }) =>
                formatDate(value),
        },

        {
            field: "actions",
            headerName: "Actions",
            width: 190,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,

            renderCell: ({
                row,
            }) => (
                <Stack
                    direction="row"
                    spacing={0.25}
                    alignItems="center"
                >
                    {canUpdate ? (
                        <Tooltip title="Edit option">
                            <IconButton
                                size="small"
                                aria-label={`Edit ${row.name}`}
                                onClick={() =>
                                    onEdit(
                                        row,
                                    )
                                }
                            >
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    ) : null}

                    {row.is_active ? (
                        canDelete ? (
                            <Tooltip title="Disable option">
                                <IconButton
                                    size="small"
                                    color="warning"
                                    aria-label={`Disable ${row.name}`}
                                    onClick={() =>
                                        onDisable(
                                            row,
                                        )
                                    }
                                >
                                    <BlockOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        ) : null
                    ) : (
                        canUpdate ? (
                            <Tooltip title="Enable option">
                                <IconButton
                                    size="small"
                                    color="success"
                                    aria-label={`Enable ${row.name}`}
                                    onClick={() =>
                                        onEnable(
                                            row,
                                        )
                                    }
                                >
                                    <CheckCircleOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        ) : null
                    )}
                </Stack>
            ),
        },
    ];

    return (
        <DataGrid
            autoHeight
            rows={options}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pagination
            paginationMode="server"
            rowCount={
                pagination?.total ??
                0
            }
            paginationModel={
                paginationModel
            }
            onPaginationModelChange={
                onPaginationModelChange
            }
            pageSizeOptions={[
                20,
                50,
                100,
            ]}
            getRowId={(row) =>
                row.id
            }
            sx={{
                border: 0,

                "& .MuiDataGrid-columnHeaders":
                    {
                        backgroundColor:
                            "action.hover",
                    },

                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within":
                    {
                        outline:
                            "none",
                    },
            }}
            slots={{
                noRowsOverlay: () => (
                    <Box
                        sx={{
                            p: 4,
                            textAlign:
                                "center",
                            color:
                                "text.secondary",
                        }}
                    >
                        No options found.
                    </Box>
                ),
            }}
        />
    );
}