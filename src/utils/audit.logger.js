const db = require('../db');

/**
 * Ghi log hành động của user vào bảng user_log
 * @param {Object} logData - Dữ liệu log
 * @param {number} logData.user_id - ID người thực hiện hành động
 * @param {string} logData.action - Loại hành động (PERMISSION_GRANTED, PERMISSION_REVOKED, etc.)
 * @param {string} logData.resource - Tài nguyên bị tác động (user_permissions, role_permissions, etc.)
 * @param {Object} logData.details - Chi tiết hành động (JSON object)
 * @param {string} logData.ip_address - IP address của user
 * @param {string} logData.user_agent - Browser/device info
 */
async function logUserAction(logData) {
    try {
        const {
            user_id,
            action,
            resource,
            details = {},
            ip_address = null,
            user_agent = null
        } = logData;

        // Kiểm tra bảng user_log có tồn tại không
        const [tables] = await db.query("SHOW TABLES LIKE 'user_log'");

        if (tables.length === 0) {
            console.warn('Table user_log does not exist. Skipping audit log.');
            return;
        }

        await db.query(
            `INSERT INTO user_log
            (user_id, action, resource, details, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                user_id,
                action,
                resource,
                JSON.stringify(details),
                ip_address,
                user_agent
            ]
        );

        console.log(`[AUDIT] ${action} by user ${user_id} on ${resource}`);
    } catch (error) {
        // Không throw error để không ảnh hưởng đến flow chính
        console.error('Error logging user action:', error);
    }
}

/**
 * Log hành động cấp quyền
 */
async function logPermissionGrant(req, targetUserId, permissionCode, organizationId) {
    await logUserAction({
        user_id: req.user?.user_id,
        action: 'PERMISSION_GRANTED',
        resource: 'user_permissions',
        details: {
            target_user_id: targetUserId,
            permission_code: permissionCode,
            organization_id: organizationId,
            granted_by: req.user?.email
        },
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
    });
}

/**
 * Log hành động thu hồi quyền
 */
async function logPermissionRevoke(req, targetUserId, permissionCode, organizationId) {
    await logUserAction({
        user_id: req.user?.user_id,
        action: 'PERMISSION_REVOKED',
        resource: 'user_permissions',
        details: {
            target_user_id: targetUserId,
            permission_code: permissionCode,
            organization_id: organizationId,
            revoked_by: req.user?.email
        },
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
    });
}

/**
 * Log hành động thêm quyền cho role
 */
async function logRolePermissionAdd(req, roleCode, permissionCode) {
    await logUserAction({
        user_id: req.user?.user_id,
        action: 'ROLE_PERMISSION_ADDED',
        resource: 'role_permissions',
        details: {
            role_code: roleCode,
            permission_code: permissionCode,
            added_by: req.user?.email
        },
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
    });
}

/**
 * Log hành động xóa quyền khỏi role
 */
async function logRolePermissionRemove(req, roleCode, permissionCode) {
    await logUserAction({
        user_id: req.user?.user_id,
        action: 'ROLE_PERMISSION_REMOVED',
        resource: 'role_permissions',
        details: {
            role_code: roleCode,
            permission_code: permissionCode,
            removed_by: req.user?.email
        },
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
    });
}

/**
 * Log hành động gán manager cho tổ chức
 */
async function logManagerAssign(req, organizationId, managerId) {
    await logUserAction({
        user_id: req.user?.user_id,
        action: 'MANAGER_ASSIGNED',
        resource: 'organization',
        details: {
            organization_id: organizationId,
            manager_user_id: managerId,
            assigned_by: req.user?.email
        },
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
    });
}

/**
 * Log hành động gỡ manager khỏi tổ chức
 */
async function logManagerRemove(req, organizationId, managerId) {
    await logUserAction({
        user_id: req.user?.user_id,
        action: 'MANAGER_REMOVED',
        resource: 'organization',
        details: {
            organization_id: organizationId,
            manager_user_id: managerId,
            removed_by: req.user?.email
        },
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
    });
}

/**
 * Log hành động truy cập bị từ chối (403)
 */
async function logAccessDenied(req, requiredPermission, resource) {
    await logUserAction({
        user_id: req.user?.user_id || null,
        action: 'ACCESS_DENIED',
        resource: resource,
        details: {
            required_permission: requiredPermission,
            path: req.path,
            method: req.method
        },
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
    });
}

module.exports = {
    logUserAction,
    logPermissionGrant,
    logPermissionRevoke,
    logRolePermissionAdd,
    logRolePermissionRemove,
    logManagerAssign,
    logManagerRemove,
    logAccessDenied
};
