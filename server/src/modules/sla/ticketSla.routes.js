import { Router } from "express";
import authMiddleware from "../auth/auth.middleware.js";
import rbacMiddleware from "../rbac/rbac.middleware.js";
import { RBAC_PERMISSIONS } from "../rbac/rbac.constants.js";
import controller from "./sla.controller.js";
import { ticketSlaParamSchema } from "./sla.validator.js";

const router=Router(),{authenticate}=authMiddleware,{requirePermission}=rbacMiddleware;
const validate=(req,res,next)=>{try{req.params=ticketSlaParamSchema.parse(req.params);next();}catch(e){next(e);}};
router.get("/:ticketId/sla",authenticate,requirePermission(RBAC_PERMISSIONS.SLA_READ),validate,controller.ticketSla);
router.get("/:ticketId/sla/history",authenticate,requirePermission(RBAC_PERMISSIONS.SLA_READ),validate,controller.history);
router.post("/:ticketId/sla/recalculate",authenticate,requirePermission(RBAC_PERMISSIONS.SLA_RECALCULATE),validate,controller.recalc);
export default router;
