import { z } from "zod";

const uuidArray = z
  .array(z.string().uuid())
  .optional()
  .default([]);

const textArray = z
  .array(z.string().min(1))
  .optional()
  .default([]);

export const dashboardTypeParamSchema = z.object({
  dashboardType: z.enum([
    "operational",
    "management",
    "professional",
    "executive",
    "audit",
  ]),
});

export const metricCodeParamSchema = z.object({
  dashboardType: z.enum([
    "operational",
    "management",
    "professional",
    "executive",
    "audit",
  ]),
  metricCode: z.string().min(1).max(120),
});

export const dashboardQuerySchema = z.object({
  periodStart: z.string().datetime({ offset: true }).optional(),
  periodEnd: z.string().datetime({ offset: true }).optional(),
  departmentId: uuidArray,
  organizationId: uuidArray,
  assignedUserId: uuidArray,
  priority: textArray,
  severity: textArray,
  category: textArray,
  status: textArray,
  slaPolicyId: uuidArray,
  slaStatus: textArray,
});

const widgetSchema = z.object({
  id: z.string().min(1).max(120),
  x: z.number().int().min(0).max(11),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1).max(100),
  minW: z.number().int().min(1).max(12).optional(),
  minH: z.number().int().min(1).max(100).optional(),
  visible: z.boolean(),
  order: z.number().int().min(0),
}).superRefine((widget, ctx) => {
  if (widget.x + widget.w > 12) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["w"],
      message: "Widget must fit within the 12-column dashboard grid.",
    });
  }

  if (widget.minW !== undefined && widget.minW > widget.w) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["minW"],
      message: "minW cannot be greater than w.",
    });
  }

  if (widget.minH !== undefined && widget.minH > widget.h) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["minH"],
      message: "minH cannot be greater than h.",
    });
  }
});

export const layoutSchema = z.object({
  version: z.number().int().positive(),
  widgets: z.array(widgetSchema).max(200),
}).superRefine((layout, ctx) => {
  const seen = new Set();

  for (const [index, widget] of layout.widgets.entries()) {
    if (seen.has(widget.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["widgets", index, "id"],
        message: "Widget IDs must be unique.",
      });
    }

    seen.add(widget.id);
  }
});

export default Object.freeze({
  dashboardTypeParamSchema,
  metricCodeParamSchema,
  dashboardQuerySchema,
  layoutSchema,
});
