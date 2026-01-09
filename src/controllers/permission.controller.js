const db = require('../db');
const { getUserPermissions } = require('../middleware/permission.middleware');

// GET /permissions - Lấy danh sách tất cả quyền
async function getAllPermissions(req, res) {
    try {
        const { module } = req.query;

        let query = 'SELECT * FROM permissions';
        const params = [];

        if (module) {
            query += ' WHERE module = ?';
            params.push(module);
        }

        query += ' ORDER BY module, code';

        const [permissions] = await db.query(query, params);

        // Group by module
        const groupedPermissions = permissions.reduce((acc, perm) => {
            if (!acc[perm.module]) {
                acc[perm.module] = [];
            }
            acc[perm.module].push(perm);
            return acc;
        }, {});

        return res.json({
            total: permissions.length,
            permissions: permissions,
            grouped: groupedPermissions
        });
    } catch (error) {
        console.error('Error getting permissions:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// GET /permissions/my - Lấy danh sách quyền của user hiện tại
async function getMyPermissions(req, res) {
    try {
        const userId = req.user?.user_id;
        const { organization_id } = req.query;

        const permissions = await getUserPermissions(userId, organization_id);

        return res.json({
            user_id: userId,
            organization_id: organization_id || 'global',
            total: permissions.length,
            permissions: permissions
        });
    } catch (error) {
        console.error('Error getting my permissions:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// GET /permissions/user/:userId - Lấy quyền của user khác (Admin only)
async function getUserPermissionsById(req, res) {
    try {
        const { userId } = req.params;
        const { organization_id } = req.query;

        const permissions = await getUserPermissions(userId, organization_id);

        return res.json({
            user_id: userId,
            organization_id: organization_id || 'global',
            total: permissions.length,
            permissions: permissions
        });
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// POST /permissions/grant - Cấp quyền cho user
async function grantPermission(req, res) {
    try {
        const { user_id, permission_code, organization_id } = req.body;
        const grantedBy = req.user?.email || 'system';

        // Validate input
        if (!user_id || !permission_code) {
            return res.status(400).json({
                message: 'Thiếu thông tin user_id hoặc permission_code'
            });
        }

        // Kiểm tra permission có tồn tại không
        const [permExists] = await db.query(
            'SELECT code FROM permissions WHERE code = ? LIMIT 1',
            [permission_code]
        );

        if (permExists.length === 0) {
            return res.status(404).json({
                message: `Quyền ${permission_code} không tồn tại`
            });
        }

        // Kiểm tra user có tồn tại không
        const [userExists] = await db.query(
            'SELECT user_id FROM `user` WHERE user_id = ? LIMIT 1',
            [user_id]
        );

        if (userExists.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng'
            });
        }

        // Insert hoặc update permission
        await db.query(
            `INSERT INTO user_permissions (user_id, permission_code, is_granted, organization_id, granted_by)
             VALUES (?, ?, 1, ?, ?)
             ON DUPLICATE KEY UPDATE is_granted = 1, granted_by = ?`,
            [user_id, permission_code, organization_id || null, grantedBy, grantedBy]
        );

        return res.json({
            message: 'Cấp quyền thành công',
            user_id,
            permission_code,
            organization_id: organization_id || 'global'
        });
    } catch (error) {
        console.error('Error granting permission:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// POST /permissions/revoke - Thu hồi quyền của user
async function revokePermission(req, res) {
    try {
        const { user_id, permission_code, organization_id } = req.body;

        if (!user_id || !permission_code) {
            return res.status(400).json({
                message: 'Thiếu thông tin user_id hoặc permission_code'
            });
        }

        // Set is_granted = 0 (deny)
        const [result] = await db.query(
            `UPDATE user_permissions
             SET is_granted = 0
             WHERE user_id = ? AND permission_code = ?
             AND (organization_id = ? OR (organization_id IS NULL AND ? IS NULL))`,
            [user_id, permission_code, organization_id, organization_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy quyền để thu hồi'
            });
        }

        return res.json({
            message: 'Thu hồi quyền thành công',
            user_id,
            permission_code,
            organization_id: organization_id || 'global'
        });
    } catch (error) {
        console.error('Error revoking permission:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// GET /roles/:roleCode/permissions - Lấy quyền của role
async function getRolePermissions(req, res) {
    try {
        const { roleCode } = req.params;

        const [permissions] = await db.query(
            `SELECT p.* FROM permissions p
             JOIN role_permissions rp ON p.code = rp.permission_code
             WHERE rp.role_code = ?
             ORDER BY p.module, p.code`,
            [roleCode]
        );

        return res.json({
            role_code: roleCode,
            total: permissions.length,
            permissions: permissions
        });
    } catch (error) {
        console.error('Error getting role permissions:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// POST /roles/:roleCode/permissions - Thêm quyền cho role
async function addRolePermission(req, res) {
    try {
        const { roleCode } = req.params;
        const { permission_code } = req.body;

        if (!permission_code) {
            return res.status(400).json({
                message: 'Thiếu thông tin permission_code'
            });
        }

        // Kiểm tra role có tồn tại không
        const [roleExists] = await db.query(
            'SELECT code FROM role WHERE code = ? LIMIT 1',
            [roleCode]
        );

        if (roleExists.length === 0) {
            return res.status(404).json({
                message: `Role ${roleCode} không tồn tại`
            });
        }

        // Insert permission cho role
        await db.query(
            `INSERT INTO role_permissions (role_code, permission_code)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE role_code = role_code`,
            [roleCode, permission_code]
        );

        return res.json({
            message: 'Thêm quyền cho role thành công',
            role_code: roleCode,
            permission_code
        });
    } catch (error) {
        console.error('Error adding role permission:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// DELETE /roles/:roleCode/permissions/:permissionCode - Xóa quyền khỏi role
async function removeRolePermission(req, res) {
    try {
        const { roleCode, permissionCode } = req.params;

        const [result] = await db.query(
            'DELETE FROM role_permissions WHERE role_code = ? AND permission_code = ?',
            [roleCode, permissionCode]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy quyền để xóa'
            });
        }

        return res.json({
            message: 'Xóa quyền khỏi role thành công',
            role_code: roleCode,
            permission_code: permissionCode
        });
    } catch (error) {
        console.error('Error removing role permission:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

module.exports = {
    getAllPermissions,
    getMyPermissions,
    getUserPermissionsById,
    grantPermission,
    revokePermission,
    getRolePermissions,
    addRolePermission,
    removeRolePermission
};
