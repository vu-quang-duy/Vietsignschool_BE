const express = require('express');
const {
    getAllPermissions,
    getMyPermissions,
    getUserPermissionsById,
    grantPermission,
    revokePermission,
    getRolePermissions,
    addRolePermission,
    removeRolePermission,
    assignOrganizationManager,
    removeOrganizationManager,
    getOrganizationManagers
} = require('../controllers/permission.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { isAdmin, hasPermission } = require('../middleware/permission.middleware');

const router = express.Router();

// ==================== Permission Routes ====================

/**
 * @route GET /permissions
 * @desc Lấy danh sách tất cả các quyền trong hệ thống
 * @access Private - Chỉ admin
 */
router.get('/permissions', authRequired, isAdmin, getAllPermissions);

/**
 * @route GET /permissions/my
 * @desc Lấy danh sách quyền của user hiện tại
 * @access Private - Authenticated user
 */
router.get('/permissions/my', authRequired, getMyPermissions);

/**
 * @route GET /permissions/user/:userId
 * @desc Lấy danh sách quyền của user khác
 * @access Private - Admin only
 */
router.get('/permissions/user/:userId', authRequired, isAdmin, getUserPermissionsById);

/**
 * @route POST /permissions/grant
 * @desc Cấp quyền cho user
 * @access Private - Admin only
 */
router.post('/permissions/grant', authRequired, isAdmin, grantPermission);

/**
 * @route POST /permissions/revoke
 * @desc Thu hồi quyền của user
 * @access Private - Admin only
 */
router.post('/permissions/revoke', authRequired, isAdmin, revokePermission);

// ==================== Role Permission Routes ====================

/**
 * @route GET /roles/:roleCode/permissions
 * @desc Lấy danh sách quyền của role
 * @access Private - Admin only
 */
router.get('/roles/:roleCode/permissions', authRequired, isAdmin, getRolePermissions);

/**
 * @route POST /roles/:roleCode/permissions
 * @desc Thêm quyền cho role
 * @access Private - Admin only
 */
router.post('/roles/:roleCode/permissions', authRequired, isAdmin, addRolePermission);

/**
 * @route DELETE /roles/:roleCode/permissions/:permissionCode
 * @desc Xóa quyền khỏi role
 * @access Private - Admin only
 */
router.delete('/roles/:roleCode/permissions/:permissionCode', authRequired, isAdmin, removeRolePermission);

// ==================== Organization Manager Routes ====================

/**
 * @route POST /organizations/:orgId/assign-manager
 * @desc Gán người phụ trách cho tổ chức
 * @access Private - Admin or ORG_ASSIGN_MANAGER permission
 */
router.post(
    '/organizations/:orgId/assign-manager',
    authRequired,
    hasPermission('ORG_ASSIGN_MANAGER'),
    assignOrganizationManager
);

/**
 * @route DELETE /organizations/:orgId/remove-manager/:userId
 * @desc Gỡ người phụ trách khỏi tổ chức
 * @access Private - Admin or ORG_ASSIGN_MANAGER permission
 */
router.delete(
    '/organizations/:orgId/remove-manager/:userId',
    authRequired,
    hasPermission('ORG_ASSIGN_MANAGER'),
    removeOrganizationManager
);

/**
 * @route GET /organizations/:orgId/managers
 * @desc Lấy danh sách người phụ trách của tổ chức
 * @access Private - Authenticated user
 */
router.get('/organizations/:orgId/managers', authRequired, getOrganizationManagers);

module.exports = router;
