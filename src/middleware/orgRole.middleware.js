const pool = require('../db');

/**
 * Middleware kiểm tra user có vai trò tổ chức yêu cầu
 * Cách dùng: hasOrgRole('CENTER_ADMIN', 'SCHOOL_ADMIN')
 */
function hasOrgRole(...requiredRoles) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.user_id;
            const organizationId = req.body.organization_id || req.params.organization_id || req.query.organization_id;

            if (!userId) {
                return res.status(401).json({ message: 'Yêu cầu đăng nhập' });
            }

            // Nếu không có organization_id, kiểm tra xem user có phải SUPER_ADMIN không
            if (!organizationId) {
                const [orgRoles] = await pool.query(
                    `SELECT role_in_org FROM organization_manager
                     WHERE user_id = ? AND role_in_org = 'SUPER_ADMIN'
                     LIMIT 1`,
                    [userId]
                );

                if (orgRoles.length > 0) {
                    req.orgRole = 'SUPER_ADMIN';
                    return next();
                }

                return res.status(403).json({
                    message: 'Yêu cầu organization_id hoặc bạn phải là SUPER_ADMIN'
                });
            }

            // Lấy vai trò của user trong tổ chức cụ thể
            const [orgRoles] = await pool.query(
                `SELECT role_in_org FROM organization_manager
                 WHERE user_id = ? AND organization_id = ?
                 LIMIT 1`,
                [userId, organizationId]
            );

            if (orgRoles.length === 0) {
                return res.status(403).json({
                    message: 'Bạn không thuộc tổ chức này'
                });
            }

            const userRole = orgRoles[0].role_in_org;

            // SUPER_ADMIN có quyền truy cập mọi thứ
            if (userRole === 'SUPER_ADMIN') {
                req.orgRole = userRole;
                req.organizationId = organizationId;
                return next();
            }

            // Kiểm tra user có một trong các vai trò yêu cầu không
            if (requiredRoles.includes(userRole)) {
                req.orgRole = userRole;
                req.organizationId = organizationId;
                return next();
            }

            return res.status(403).json({
                message: `Cấm truy cập: Yêu cầu một trong các vai trò: ${requiredRoles.join(', ')}. Vai trò của bạn: ${userRole}`
            });

        } catch (error) {
            console.error('Lỗi trong hasOrgRole middleware:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    };
}

/**
 * Middleware kiểm tra user có vai trò tối thiểu trong phân cấp
 * Phân cấp: SUPER_ADMIN > CENTER_ADMIN > SCHOOL_ADMIN > TEACHER > STUDENT > USER
 */
function hasMinOrgRole(minRole) {
    const roleHierarchy = {
        'SUPER_ADMIN': 6,
        'CENTER_ADMIN': 5,
        'SCHOOL_ADMIN': 4,
        'TEACHER': 3,
        'STUDENT': 2,
        'USER': 1
    };

    return async (req, res, next) => {
        try {
            const userId = req.user?.user_id;
            const organizationId = req.body.organization_id || req.params.organization_id || req.query.organization_id;

            if (!userId) {
                return res.status(401).json({ message: 'Yêu cầu đăng nhập' });
            }

            if (!organizationId) {
                // Kiểm tra xem user có phải SUPER_ADMIN trong bất kỳ tổ chức nào không
                const [orgRoles] = await pool.query(
                    `SELECT role_in_org FROM organization_manager
                     WHERE user_id = ? AND role_in_org = 'SUPER_ADMIN'
                     LIMIT 1`,
                    [userId]
                );

                if (orgRoles.length > 0) {
                    req.orgRole = 'SUPER_ADMIN';
                    return next();
                }

                return res.status(403).json({
                    message: 'Yêu cầu organization_id hoặc bạn phải là SUPER_ADMIN'
                });
            }

            // Lấy vai trò của user trong tổ chức cụ thể
            const [orgRoles] = await pool.query(
                `SELECT role_in_org FROM organization_manager
                 WHERE user_id = ? AND organization_id = ?
                 LIMIT 1`,
                [userId, organizationId]
            );

            if (orgRoles.length === 0) {
                return res.status(403).json({
                    message: 'Bạn không thuộc tổ chức này'
                });
            }

            const userRole = orgRoles[0].role_in_org;
            const userRoleLevel = roleHierarchy[userRole] || 0;
            const minRoleLevel = roleHierarchy[minRole] || 0;

            if (userRoleLevel >= minRoleLevel) {
                req.orgRole = userRole;
                req.organizationId = organizationId;
                return next();
            }

            return res.status(403).json({
                message: `Cấm truy cập: Yêu cầu ${minRole} trở lên. Vai trò của bạn: ${userRole}`
            });

        } catch (error) {
            console.error('Lỗi trong hasMinOrgRole middleware:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    };
}

/**
 * Lấy danh sách tổ chức và vai trò của user
 */
async function getUserOrganizations(userId) {
    const [orgs] = await pool.query(
        `SELECT om.organization_id, om.role_in_org, om.is_primary, o.name as organization_name
         FROM organization_manager om
         LEFT JOIN organization o ON om.organization_id = o.organization_id
         WHERE om.user_id = ?
         ORDER BY om.is_primary DESC, om.assigned_date DESC`,
        [userId]
    );
    return orgs;
}

/**
 * Kiểm tra user có phải SUPER_ADMIN trong bất kỳ tổ chức nào không
 */
async function isSuperAdmin(userId) {
    const [result] = await pool.query(
        `SELECT COUNT(*) as count FROM organization_manager
         WHERE user_id = ? AND role_in_org = 'SUPER_ADMIN'`,
        [userId]
    );
    return result[0].count > 0;
}

/**
 * Lấy quyền tự động cấp dựa trên vai trò tổ chức
 */
function getAutoPermissionsByRole(role) {
    const permissionsByRole = {
        'SUPER_ADMIN': [
            'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_ASSIGN_ROLE',
            'COURSE_VIEW', 'COURSE_CREATE', 'COURSE_UPDATE', 'COURSE_DELETE',
            'LESSON_VIEW', 'LESSON_CREATE', 'LESSON_UPDATE', 'LESSON_DELETE',
            'ORGANIZATION_VIEW', 'ORGANIZATION_CREATE', 'ORGANIZATION_UPDATE', 'ORGANIZATION_DELETE',
            'REPORT_VIEW', 'REPORT_EXPORT',
            'SETTING_VIEW', 'SETTING_UPDATE'
        ],
        'CENTER_ADMIN': [
            'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_ASSIGN_ROLE',
            'COURSE_VIEW', 'COURSE_CREATE', 'COURSE_UPDATE', 'COURSE_DELETE',
            'LESSON_VIEW', 'LESSON_CREATE', 'LESSON_UPDATE', 'LESSON_DELETE',
            'ORGANIZATION_VIEW', 'ORGANIZATION_UPDATE',
            'REPORT_VIEW', 'REPORT_EXPORT'
        ],
        'SCHOOL_ADMIN': [
            'USER_VIEW', 'USER_UPDATE',
            'COURSE_VIEW', 'COURSE_CREATE', 'COURSE_UPDATE',
            'LESSON_VIEW', 'LESSON_CREATE', 'LESSON_UPDATE',
            'ORGANIZATION_VIEW',
            'REPORT_VIEW'
        ],
        'TEACHER': [
            'USER_VIEW',
            'COURSE_VIEW', 'COURSE_UPDATE',
            'LESSON_VIEW', 'LESSON_CREATE', 'LESSON_UPDATE',
            'REPORT_VIEW'
        ],
        'STUDENT': [
            'COURSE_VIEW',
            'LESSON_VIEW'
        ],
        'USER': [
            'COURSE_VIEW'
        ]
    };

    return permissionsByRole[role] || [];
}

// Middleware cũ để tương thích ngược
async function orgRoleMiddleware(req, res, next) {
    try {
        const userId = req.user.user_id;
        const orgId = req.params.id || req.body.organization_id;
        if (!orgId) {
            return res.status(400).json({ message: 'Yêu cầu Organization ID' });
        }
        const [rows] = await pool.query(
            `SELECT role_in_org FROM organization_manager
             WHERE user_id = ? AND organization_id = ? LIMIT 1`,
            [userId, orgId]
        );
        if (rows.length === 0) {
            return res.status(403).json({ message: 'Truy cập bị từ chối. Bạn không phải thành viên của tổ chức này.' });
        }
        req.userRole = rows[0].role_in_org;
        req.orgRole = rows[0].role_in_org;
        next();
    } catch (error) {
        console.error('Lỗi trong orgRoleMiddleware:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
}

module.exports = {
    hasOrgRole,
    hasMinOrgRole,
    getUserOrganizations,
    isSuperAdmin,
    getAutoPermissionsByRole,
    orgRoleMiddleware // Hỗ trợ tương thích ngược
};
