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

// POST /organizations/:orgId/assign-manager - Gán người phụ trách tổ chức
async function assignOrganizationManager(req, res) {
    try {
        const { orgId } = req.params;
        const { user_id } = req.body;
        const assignedBy = req.user?.email || 'system';

        if (!user_id) {
            return res.status(400).json({
                message: 'Thiếu thông tin user_id'
            });
        }

        // Kiểm tra user có trong tổ chức chưa
        const [existing] = await db.query(
            'SELECT * FROM user_organization WHERE user_id = ? AND organization_id = ?',
            [user_id, orgId]
        );

        if (existing.length === 0) {
            // Thêm user vào tổ chức với role MANAGER
            await db.query(
                `INSERT INTO user_organization (user_id, organization_id, role, status, is_manager, assigned_by)
                 VALUES (?, ?, 'MANAGER', 'ACTIVE', 1, ?)`,
                [user_id, orgId, assignedBy]
            );
        } else {
            // Cập nhật is_manager = 1
            await db.query(
                `UPDATE user_organization
                 SET is_manager = 1, role = 'MANAGER', assigned_by = ?, assigned_date = NOW()
                 WHERE user_id = ? AND organization_id = ?`,
                [assignedBy, user_id, orgId]
            );
        }

        return res.json({
            message: 'Gán người phụ trách thành công',
            organization_id: orgId,
            manager_user_id: user_id
        });
    } catch (error) {
        console.error('Error assigning manager:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// DELETE /organizations/:orgId/remove-manager/:userId - Gỡ người phụ trách
async function removeOrganizationManager(req, res) {
    try {
        const { orgId, userId } = req.params;

        const [result] = await db.query(
            `UPDATE user_organization
             SET is_manager = 0, role = 'MEMBER'
             WHERE user_id = ? AND organization_id = ?`,
            [userId, orgId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy người phụ trách'
            });
        }

        return res.json({
            message: 'Gỡ người phụ trách thành công',
            organization_id: orgId,
            user_id: userId
        });
    } catch (error) {
        console.error('Error removing manager:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// GET /organizations/:orgId/managers - Lấy danh sách người phụ trách
async function getOrganizationManagers(req, res) {
    try {
        const { orgId } = req.params;

        const [managers] = await db.query(
            `SELECT u.user_id, u.name, u.email, uo.role, uo.assigned_by, uo.assigned_date
             FROM user_organization uo
             JOIN user u ON uo.user_id = u.user_id
             WHERE uo.organization_id = ? AND uo.is_manager = 1 AND uo.status = 'ACTIVE'
             ORDER BY uo.assigned_date DESC`,
            [orgId]
        );

        return res.json({
            organization_id: orgId,
            total: managers.length,
            managers: managers
        });
    } catch (error) {
        console.error('Error getting managers:', error);
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
    removeRolePermission,
    assignOrganizationManager,
    removeOrganizationManager,
    getOrganizationManagers
};
