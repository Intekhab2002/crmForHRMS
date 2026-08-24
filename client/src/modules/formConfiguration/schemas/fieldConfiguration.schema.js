import * as Yup from "yup";

import { getDataTypesForFieldType } from "../utils/fieldDefaults";

const optionSchema = Yup.object({
  label: Yup.string().trim().required("Option label is required.").max(200),
  value: Yup.mixed()
    .test("option-value", "Option value is required.", (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
    ),
});

export const fieldConfigurationSchema = Yup.object({
  fieldKey: Yup.string()
    .trim()
    .matches(
      /^[a-z][a-z0-9_]*$/,
      "Use lowercase letters, numbers and underscores; start with a letter.",
    )
    .min(2)
    .max(100)
    .required("Field key is required."),
  name: Yup.string().trim().min(2).max(150).required("Name is required."),
  label: Yup.string().trim().max(200).required("Label is required."),
  description: Yup.string().nullable().max(2000),
  type: Yup.string().required("Field type is required."),
  dataType: Yup.string().required("Data type is required."),
  placeholder: Yup.string().nullable().max(255),
  helpText: Yup.string().nullable().max(2000),
  defaultValue: Yup.mixed().nullable(),
  isVisible: Yup.boolean().required(),
  isEnabled: Yup.boolean().required(),
  isEditable: Yup.boolean().required(),
  isReadOnly: Yup.boolean().required(),
  isRequired: Yup.boolean().required(),
  isSearchable: Yup.boolean().required(),
  isFilterable: Yup.boolean().required(),
  isSortable: Yup.boolean().required(),
  validationConfig: Yup.object().default({}),
  optionsConfig: Yup.object({
    static: Yup.array().of(optionSchema).max(500),
    dataSource: Yup.object({
      type: Yup.string().oneOf(["api", "static"]),
      endpoint: Yup.string().trim().max(500),
    }).nullable(),
  }).default({}),
  storageType: Yup.string()
    .oneOf(["relational", "custom_data", "reference", "specialized"])
    .required("Storage type is required."),
  storageColumn: Yup.string().nullable().max(150),
  storageKey: Yup.string().nullable().max(150),
  referenceEntity: Yup.string().nullable().max(100),
}).test(
  "type-data-type",
  "The selected field type does not support the selected data type.",
  function (values) {
    if (!values?.type || !values?.dataType) return true;

    if (!getDataTypesForFieldType(values.type).includes(values.dataType)) {
      return this.createError({
        path: "dataType",
        message: `${values.type} supports: ${getDataTypesForFieldType(values.type).join(", ")}.`,
      });
    }

    return true;
  },
).test(
  "storage-mapping",
  "Storage mapping is incomplete.",
  function (values) {
    if (!values?.storageType) return true;

    if (values.storageType === "relational" && !values.storageColumn?.trim()) {
      return this.createError({
        path: "storageColumn",
        message: "Storage column is required for relational fields.",
      });
    }

    if (values.storageType === "custom_data" && !values.storageKey?.trim()) {
      return this.createError({
        path: "storageKey",
        message: "Storage key is required for custom-data fields.",
      });
    }

    if (values.storageType === "reference" && !values.referenceEntity?.trim()) {
      return this.createError({
        path: "referenceEntity",
        message: "Reference entity is required for reference fields.",
      });
    }

    if (values.storageType === "specialized" && !values.storageKey?.trim()) {
      return this.createError({
        path: "storageKey",
        message: "Storage key is required for specialized fields.",
      });
    }

    return true;
  },
);
