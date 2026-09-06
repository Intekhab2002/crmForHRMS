export const components = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      size: "small",
    },
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: "none",
        fontWeight: 700,
      },
    },
  },

  MuiIconButton: {
    defaultProps: {
      size: "small",
    },
  },

  MuiTextField: {
    defaultProps: {
      margin: "dense",
      size: "small",
    },
  },

  MuiFormControl: {
    defaultProps: {
      margin: "dense",
      size: "small",
    },
  },

  MuiInputBase: {
    defaultProps: {
      margin: "dense",
    },
  },

  MuiOutlinedInput: {
    defaultProps: {
      margin: "dense",
    },
  },

  MuiInputLabel: {
    defaultProps: {
      margin: "dense",
    },
  },

  MuiFormHelperText: {
    defaultProps: {
      margin: "dense",
    },
  },

  MuiListItem: {
    defaultProps: {
      dense: true,
    },
  },

  MuiToolbar: {
    defaultProps: {
      variant: "dense",
    },
  },

  MuiTable: {
    defaultProps: {
      size: "small",
    },
  },
  MuiDataGrid: {
    defaultProps: {
      density: "compact",
      disableRowSelectionOnClick: true,
    },

    styleOverrides: {
      root: {
        border: 0,

        "--DataGrid-rowBorderColor": "rgba(0, 0, 0, 0.08)",
      },

      columnHeaders: {
        fontWeight: 700,
      },

      columnHeaderTitle: {
        fontWeight: 800,
      },

      cell: {
        fontSize: "0.8125rem",
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
};
