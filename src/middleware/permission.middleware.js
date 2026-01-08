const db = require('../db');

/**
 * Kiểm tra user có quyền cụ thể không
 * @param {string} permissionCode - Mã quyền cần kiểm tra (VD: 'USER_CREATE')
 * @param {number|null} organizationId - ID tổ chức (null = global permission)
 * @returns {Function} Express middleware
 */
function hasPermission(permissionCode, organizationId = null) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.user_id;

            if (!userId) {
                return res.status(401).json({ message: 'Chưa đăng nhập' });
            }

            // Lấy organization_id từ params hoặc body nếu không truyền vào
            const orgId = organizationId || req.params.organization_id || req.body.organization_id || null;

            // Kiểm tra quyền
            const hasAccess = await checkUserPermission(userId, permissionCode, orgId);

            if (!hasAccess) {
                return res.status(403).json({
                    message: 'Bạn không có quyền thực hiện hành động này',
                    required_permission: permissionCode
                });
            }

            // Gắn thông tin permission vào request
            req.permission = {
                code: permissionCode,
                organizationId: orgId
            };

            next();
        } catch (error) {
            console.error('Error in hasPermission middleware:', error);
            return res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    };
}

/**
 * Kiểm tra user có một trong các quyền không
 * @param {string[]} permissionCodes - Mảng các mã quyền
 * @returns {Function} Express middleware
 */
function hasAnyPermission(permissionCodes) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.user_id;

            if (!userId) {
                return res.status(401).json({ message: 'Chưa đăng nhập' });
            }

            const orgId = req.params.organization_id || req.body.organization_id || null;

            // Kiểm tra từng quyền
            for (const permCode of permissionCodes) {
                const hasAccess = await checkUserPermission(userId, permCode, orgId);
                if (hasAccess) {
                    req.permission = {
                        code: permCode,
                        organizationId: orgId
                    };
                    return next();
                }
            }

            return res.status(403).json({
                message: 'Bạn không có quyền thực hiện hành động này',
                required_permissions: permissionCodes
            });
        } catch (error) {
            console.error('Error in hasAnyPermission middleware:', error);
            return res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    };
}

/**
 * Kiểm tra user có phải là quản trị viên không
 */
function isAdmin(req, res, next) {
    return hasPermission('SYSTEM_ADMIN')(req, res, next);
}

/**
 * Kiểm tra user có role cụ thể không
 * @param {string|string[]} roles - Role code hoặc mảng role codes
 */
function hasRole(roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];

    return async (req, res, next) => {
        try {
            const userId = req.user?.user_id;

            if (!userId) {
                return res.status(401).json({ message: 'Chưa đăng nhập' });
            }

            // Lấy role của user
            const [userRows] = await db.query(
                'SELECT code FROM `user` WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
                [userId]
            );

            if (userRows.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }

            const userRole = userRows[0].code;

            if (!roleArray.includes(userRole)) {
                return res.status(403).json({
                    message: 'Bạn không có quyền truy cập',
                    required_roles: roleArray,
                    your_role: userRole
                });
            }

            req.userRole = userRole;
            next();
        } catch (error) {
            console.error('Error in hasRole middleware:', error);
            return res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    };
}

/**
 * Kiểm tra user có phải là manager của tổ chức không
 */
function isOrganizationManager(req, res, next) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.user_id;
            const orgId = req.params.organization_id || req.params.id || req.body.organization_id;

            if (!userId) {
                return res.status(401).json({ message: 'Chưa đăng nhập' });
            }

            if (!orgId) {
                return res.status(400).json({ message: 'Thiếu thông tin organization_id' });
            }

            // Kiểm tra user có phải manager không
            const [rows] = await db.query(
                `SELECT role, is_manager FROM user_organization
                 WHERE user_id = ? AND organization_id = ? AND status = 'ACTIVE'
                 LIMIT 1`,
                [userId, orgId]
            );

            if (rows.length === 0) {
                return res.status(403).json({
                    message: 'Bạn không phải thành viên của tổ chức này'
                });
            }

            // Kiểm tra có phải manager hoặc có quyền quản lý
            const isManager = rows[0].is_manager === 1 || rows[0].role === 'MANAGER';

            if (!isManager) {
                return res.status(403).json({
                    message: 'Bạn không phải người phụ trách tổ chức này'
                });
            }

            req.orgRole = rows[0].role;
            req.isManager = true;

            next();
        } catch (error) {
            console.error('Error in isOrganizationManager middleware:', error);
            return res.status(500).json({
                message: 'Lỗi server',
                error: error.message
            });
        }
    };
}

/**
 * Core function: Kiểm tra user có quyền cụ thể không
 */
async function checkUserPermission(userId, permissionCode, organizationId = null) {
    try {
        // 1. Kiểm tra user-specific permission (override)
        const [userPerms] = await db.query(
            `SELECT is_granted FROM user_permissions
             WHERE user_id = ? AND permission_code = ?
             AND (organization_id = ? OR organization_id IS NULL)
             ORDER BY organization_id DESC LIMIT 1`,
            [userId, permissionCode, organizationId]
        );

        if (userPerms.length > 0) {
            return userPerms[0].is_granted === 1;
        }

        // 2. Kiểm tra role-based permission
        const [rolePerms] = await db.query(
            `SELECT rp.permission_code
             FROM role_permissions rp
             JOIN user u ON u.code = rp.role_code
             WHERE u.user_id = ? AND rp.permission_code = ?
             LIMIT 1`,
            [userId, permissionCode]
        );

        if (rolePerms.length > 0) {
            return true;
        }

        // 3. Kiểm tra SYSTEM_ADMIN (admin có toàn quyền)
        const [adminCheck] = await db.query(
            `SELECT rp.permission_code
             FROM role_permissions rp
             JOIN user u ON u.code = rp.role_code
             WHERE u.user_id = ? AND rp.permission_code = 'SYSTEM_ADMIN'
             LIMIT 1`,
            [userId]
        );

        return adminCheck.length > 0;
    } catch (error) {
        console.error('Error in checkUserPermission:', error);
        return false;
    }
}

/**
 * Helper: Lấy tất cả quyền của user
 */
async function getUserPermissions(userId, organizationId = null) {
    try {
        const [permissions] = await db.query(
            `SELECT DISTINCT p.code, p.name, p.description, p.module
             FROM permissions p
             WHERE p.code IN (
                 -- Role-based permissions
                 SELECT rp.permission_code
                 FROM role_permissions rp
                 JOIN user u ON u.code = rp.role_code
                 WHERE u.user_id = ?

                 UNION

                 -- User-specific permissions
                 SELECT up.permission_code
                 FROM user_permissions up
                 WHERE up.user_id = ? AND up.is_granted = 1
                 AND (up.organization_id = ? OR up.organization_id IS NULL)
             )
             ORDER BY p.module, p.code`,
            [userId, userId, organizationId]
        );

        return permissions;
    } catch (error) {
        console.error('Error in getUserPermissions:', error);
        return [];
    }
}

module.exports = {
    hasPermission,
    hasAnyPermission,
    isAdmin,
    hasRole,
    isOrganizationManager,
    checkUserPermission,
    getUserPermissions
};
