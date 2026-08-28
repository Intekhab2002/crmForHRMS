/**
 * CRM for HRMS - Role Management Controller
 */

import { ApiResponse } from "../../helpers/ApiResponse.js";
import roleService from "./role.service.js";
import { ROLE_SUCCESS_CODES } from "./role.constant.js";

async function getRoles(req, res, next) {
  try {
    const result = await roleService.getRoles(req.validatedQuery,);

    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      "Roles retrieved successfully.",
    );
  } catch (error) {
    return next(error);
  }
}

async function getRoleById(req, res, next) {
  try {
    const role = await roleService.getRoleById(
      req.validatedParams.roleId,
      req.auth?.userId,
    );
    return ApiResponse.success(res, role, "Role retrieved successfully.");
  } catch (error) {
    return next(error);
  }
}

async function createRole(req, res, next) {
  try {
    const role = await roleService.createRole(req.validatedBody, req.auth?.userId);
    return ApiResponse.created(res, role, "Role created successfully.", {
      code: ROLE_SUCCESS_CODES.ROLE_CREATED,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const role = await roleService.updateRole(
      req.validatedParams.roleId,
      req.validatedBody,
      req.auth?.userId,
    );

    return ApiResponse.updated(res, role, "Role updated successfully.", {
      code: ROLE_SUCCESS_CODES.ROLE_UPDATED,
    });
  } catch (error) {
    return next(error);
  }
}

async function deactivateRole(req, res, next) {
  try {
    const role = await roleService.deactivateRole(
      req.validatedParams.roleId,
      req.auth?.userId,
    );

    return ApiResponse.updated(res, role, "Role deactivated successfully.", {
      code: ROLE_SUCCESS_CODES.ROLE_DEACTIVATED,
    });
  } catch (error) {
    return next(error);
  }
}

async function getRolePermissions(req, res, next) {
  try {
    const permissions = await roleService.getRolePermissions(req.validatedParams.roleId);
    return ApiResponse.success(
      res,
      permissions,
      "Role permissions retrieved successfully.",
    );
  } catch (error) {
    return next(error);
  }
}

async function replaceRolePermissions(req, res, next) {
  try {
    const permissions = await roleService.replaceRolePermissions(
      req.validatedParams.roleId,
      req.validatedBody.permissionIds,
      req.auth?.userId,
    );

    return ApiResponse.updated(
      res,
      permissions,
      "Role permissions updated successfully.",
      {
        code: ROLE_SUCCESS_CODES.ROLE_PERMISSIONS_UPDATED,
      },
    );
  } catch (error) {
    return next(error);
  }
}

async function getRoleUsers(req, res, next) {
  try {
    const users = await roleService.getRoleUsers(req.validatedParams.roleId);
    return ApiResponse.success(
      res,
      users,
      "Role users retrieved successfully.",
    );
  } catch (error) {
    return next(error);
  }
}

async function assignRoleToUser(req, res, next) {
  try {
    const assignment = await roleService.assignRoleToUser(
      req.validatedParams.roleId,
      req.validatedParams.userId,
      req.auth?.userId,
    );
    return ApiResponse.created(
      res,
      assignment,
      "Role assigned to user successfully.",
      { code: ROLE_SUCCESS_CODES.ROLE_ASSIGNED },
    );
  } catch (error) {
    return next(error);
  }
}

async function removeRoleFromUser(req, res, next) {
  try {
    const assignment = await roleService.removeRoleFromUser(
      req.validatedParams.roleId,
      req.validatedParams.userId,
      req.auth?.userId,
    );
    return ApiResponse.deleted(
      res,
      assignment,
      "Role removed from user successfully.",
      { code: ROLE_SUCCESS_CODES.ROLE_UNASSIGNED },
    );
  } catch (error) {
    return next(error);
  }
}

async function deleteRole(req, res, next) {
  try {
    const role = await roleService.deleteRole(
      req.validatedParams.roleId,
      req.auth?.userId,
    );

    return ApiResponse.deleted(res, role, "Role deleted successfully.", {
      code: ROLE_SUCCESS_CODES.ROLE_DELETED,
    });
  } catch (error) {
    return next(error);
  }
}

async function getRolePermissionMatrix(req, res, next) {
  try {
    const matrix = await roleService.getRolePermissionMatrix(
      req.validatedParams.roleId,
      req.auth?.userId,
    );

    return ApiResponse.success(
      res,
      matrix,
      "Role permission matrix retrieved successfully.",
    );
  } catch (error) {
    return next(error);
  }
}

export default Object.freeze({
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deactivateRole,
  getRolePermissions,
  replaceRolePermissions,
  getRoleUsers,
  assignRoleToUser,
  removeRoleFromUser,
  deleteRole,
  getRolePermissionMatrix,
});
