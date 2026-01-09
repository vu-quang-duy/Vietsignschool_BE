const pool = require('../db');
const {
    assignOrgRole,
    removeOrgRole,
    getUserRoleInOrg,
    getUserOrganizations,
    getOrganizationUsers,
    canAssignRole,
    setPrimaryOrganization,
    getPrimaryOrganization,
    isOrgMember,
    getOrgRoleStats,
    VALID_ROLES
} = require('../utils/orgRole.utils');

/**
 * POST /org-roles/assign
 * Gán vai trò tổ chức cho user
 */
async function assignRole(req, res) {
    try {
        const { organization_id, user_id, role_in_org, is_primary } = req.body;
        const assignerId = req.user.user_id;

        // Validate input
        if (!organization_id || !user_id || !role_in_org) {
            return res.status(400).json({
                message: 'organization_id, user_id, và role_in_org là bắt buộc'
            });
        }

        // Validate role
        if (!VALID_ROLES.includes(role_in_org)) {
            return res.status(400).json({
                message: `Role không hợp lệ. Valid roles: ${VALID_ROLES.join(', ')}`
            });
        }

        // Get assigner's role in this organization
        const assignerRole = await getUserRoleInOrg(assignerId, organization_id);

        if (!assignerRole) {
            return res.status(403).json({
                message: 'Bạn không có quyền quản lý tổ chức này'
            });
        }

        // Check if assigner can assign this role
        if (!canAssignRole(assignerRole.role_in_org, role_in_org)) {
            return res.status(403).json({
                message: `Bạn (${assignerRole.role_in_org}) không có quyền gán vai trò ${role_in_org}`
            });
        }

        // Check if target user exists and is not deleted
        const [userCheck] = await pool.query(
            'SELECT user_id, name FROM `user` WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
            [user_id]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Assign role
        await assignOrgRole(user_id, organization_id, role_in_org, is_primary, assignerId);

        return res.status(200).json({
            message: 'Gán vai trò thành công',
            data: {
                user_id,
                organization_id,
                role_in_org,
                is_primary: is_primary || false
            }
        });

    } catch (error) {
        console.error('Error in assignRole:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

/**
 * DELETE /org-roles/remove
 * Xóa vai trò tổ chức của user
 */
async function removeRole(req, res) {
    try {
        const { organization_id, user_id } = req.body;
        const requesterId = req.user.user_id;

        // Validate input
        if (!organization_id || !user_id) {
            return res.status(400).json({
                message: 'organization_id và user_id là bắt buộc'
            });
        }

        // Get requester's role
        const requesterRole = await getUserRoleInOrg(requesterId, organization_id);

        if (!requesterRole) {
            return res.status(403).json({
                message: 'Bạn không có quyền quản lý tổ chức này'
            });
        }

        // Get target user's role
        const targetRole = await getUserRoleInOrg(user_id, organization_id);

        if (!targetRole) {
            return res.status(404).json({
                message: 'User không có vai trò trong tổ chức này'
            });
        }

        // Check if requester can remove this role
        if (!canAssignRole(requesterRole.role_in_org, targetRole.role_in_org)) {
            return res.status(403).json({
                message: `Bạn không có quyền xóa vai trò ${targetRole.role_in_org}`
            });
        }

        // Remove role
        const removed = await removeOrgRole(user_id, organization_id);

        if (removed) {
            return res.status(200).json({
                message: 'Xóa vai trò thành công'
            });
        } else {
            return res.status(404).json({
                message: 'Không tìm thấy vai trò để xóa'
            });
        }

    } catch (error) {
        console.error('Error in removeRole:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

/**
 * GET /org-roles/user/:userId
 * Lấy tất cả tổ chức mà user tham gia
 */
async function getUserRoles(req, res) {
    try {
        const { userId } = req.params;
        const requesterId = req.user.user_id;

        // Users can view their own roles, or admins can view any user's roles
        if (parseInt(userId) !== requesterId) {
            // Check if requester is SUPER_ADMIN
            const [superAdminCheck] = await pool.query(
                `SELECT role_in_org FROM organization_manager
                 WHERE user_id = ? AND role_in_org = 'SUPER_ADMIN'
                 LIMIT 1`,
                [requesterId]
            );

            if (superAdminCheck.length === 0) {
                return res.status(403).json({
                    message: 'Bạn chỉ có thể xem vai trò của chính mình'
                });
            }
        }

        const organizations = await getUserOrganizations(userId);

        return res.status(200).json({
            message: 'Lấy danh sách tổ chức thành công',
            data: organizations
        });

    } catch (error) {
        console.error('Error in getUserRoles:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

/**
 * GET /org-roles/organization/:organizationId
 * Lấy tất cả users trong tổ chức với vai trò
 */
async function getOrgUsers(req, res) {
    try {
        const { organizationId } = req.params;
        const { role } = req.query;
        const requesterId = req.user.user_id;

        // Check if requester is member of this organization
        const isMember = await isOrgMember(requesterId, organizationId);

        if (!isMember) {
            return res.status(403).json({
                message: 'Bạn không phải thành viên của tổ chức này'
            });
        }

        const users = await getOrganizationUsers(organizationId, role);

        return res.status(200).json({
            message: 'Lấy danh sách user thành công',
            data: users
        });

    } catch (error) {
        console.error('Error in getOrgUsers:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

/**
 * PUT /org-roles/set-primary
 * Đặt tổ chức chính cho user
 */
async function setUserPrimaryOrg(req, res) {
    try {
        const { organization_id } = req.body;
        const userId = req.user.user_id;

        if (!organization_id) {
            return res.status(400).json({
                message: 'organization_id là bắt buộc'
            });
        }

        // Set primary organization
        await setPrimaryOrganization(userId, organization_id);

        return res.status(200).json({
            message: 'Đặt tổ chức chính thành công'
        });

    } catch (error) {
        console.error('Error in setUserPrimaryOrg:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

/**
 * GET /org-roles/primary
 * Lấy tổ chức chính của user
 */
async function getUserPrimaryOrg(req, res) {
    try {
        const userId = req.user.user_id;

        const primaryOrg = await getPrimaryOrganization(userId);

        if (!primaryOrg) {
            return res.status(404).json({
                message: 'Chưa có tổ chức chính'
            });
        }

        return res.status(200).json({
            message: 'Lấy tổ chức chính thành công',
            data: primaryOrg
        });

    } catch (error) {
        console.error('Error in getUserPrimaryOrg:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

/**
 * GET /org-roles/stats/:organizationId
 * Thống kê vai trò trong tổ chức
 */
async function getOrgStats(req, res) {
    try {
        const { organizationId } = req.params;
        const requesterId = req.user.user_id;

        // Check if requester is admin in this organization
        const requesterRole = await getUserRoleInOrg(requesterId, organizationId);

        if (!requesterRole || !['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN'].includes(requesterRole.role_in_org)) {
            return res.status(403).json({
                message: 'Bạn không có quyền xem thống kê tổ chức này'
            });
        }

        const stats = await getOrgRoleStats(organizationId);

        return res.status(200).json({
            message: 'Lấy thống kê thành công',
            data: stats
        });

    } catch (error) {
        console.error('Error in getOrgStats:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

/**
 * GET /org-roles/check
 * Kiểm tra vai trò của user trong tổ chức
 */
async function checkUserRole(req, res) {
    try {
        const { organization_id } = req.query;
        const userId = req.user.user_id;

        if (!organization_id) {
            return res.status(400).json({
                message: 'organization_id là bắt buộc'
            });
        }

        const userRole = await getUserRoleInOrg(userId, organization_id);

        if (!userRole) {
            return res.status(404).json({
                message: 'Bạn không có vai trò trong tổ chức này'
            });
        }

        return res.status(200).json({
            message: 'Lấy vai trò thành công',
            data: userRole
        });

    } catch (error) {
        console.error('Error in checkUserRole:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

module.exports = {
    assignRole,
    removeRole,
    getUserRoles,
    getOrgUsers,
    setUserPrimaryOrg,
    getUserPrimaryOrg,
    getOrgStats,
    checkUserRole
};
