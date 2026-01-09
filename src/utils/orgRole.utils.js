const pool = require('../db');

/**
 * Ánh xạ phân cấp vai trò
 */
const ROLE_HIERARCHY = {
    'SUPER_ADMIN': 6,
    'CENTER_ADMIN': 5,
    'SCHOOL_ADMIN': 4,
    'TEACHER': 3,
    'STUDENT': 2,
    'USER': 1
};

/**
 * Các mã vai trò hợp lệ
 */
const VALID_ROLES = ['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'USER'];

/**
 * Kiểm tra vai trò có hợp lệ không
 */
function isValidRole(role) {
    return VALID_ROLES.includes(role);
}

/**
 * So sánh hai vai trò (trả về true nếu role1 cao hơn hoặc bằng role2)
 */
function isRoleHigherOrEqual(role1, role2) {
    const level1 = ROLE_HIERARCHY[role1] || 0;
    const level2 = ROLE_HIERARCHY[role2] || 0;
    return level1 >= level2;
}

/**
 * Gán vai trò tổ chức cho user
 */
async function assignOrgRole(userId, organizationId, roleInOrg, isPrimary = false, assignedBy = null) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra tính hợp lệ của vai trò
        if (!isValidRole(roleInOrg)) {
            throw new Error(`Vai trò không hợp lệ: ${roleInOrg}. Các vai trò hợp lệ: ${VALID_ROLES.join(', ')}`);
        }

        // Kiểm tra xem user đã có vai trò trong tổ chức này chưa
        const [existingRole] = await connection.query(
            `SELECT id, role_in_org FROM organization_manager
             WHERE user_id = ? AND organization_id = ?`,
            [userId, organizationId]
        );

        if (existingRole.length > 0) {
            // Cập nhật vai trò hiện tại
            await connection.query(
                `UPDATE organization_manager
                 SET role_in_org = ?, is_primary = ?, modified_date = NOW()
                 WHERE id = ?`,
                [roleInOrg, isPrimary ? 1 : 0, existingRole[0].id]
            );
        } else {
            // Thêm vai trò mới
            await connection.query(
                `INSERT INTO organization_manager
                 (organization_id, user_id, role_in_org, is_primary, assigned_date, assigned_by)
                 VALUES (?, ?, ?, ?, NOW(), ?)`,
                [organizationId, userId, roleInOrg, isPrimary ? 1 : 0, assignedBy]
            );
        }

        // Nếu đặt làm tổ chức chính, bỏ đánh dấu chính của các tổ chức khác
        if (isPrimary) {
            await connection.query(
                `UPDATE organization_manager
                 SET is_primary = 0
                 WHERE user_id = ? AND organization_id != ?`,
                [userId, organizationId]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Xóa vai trò tổ chức của user
 */
async function removeOrgRole(userId, organizationId) {
    const [result] = await pool.query(
        `DELETE FROM organization_manager
         WHERE user_id = ? AND organization_id = ?`,
        [userId, organizationId]
    );
    return result.affectedRows > 0;
}

/**
 * Lấy vai trò của user trong tổ chức cụ thể
 */
async function getUserRoleInOrg(userId, organizationId) {
    const [rows] = await pool.query(
        `SELECT role_in_org, is_primary
         FROM organization_manager
         WHERE user_id = ? AND organization_id = ?
         LIMIT 1`,
        [userId, organizationId]
    );

    return rows.length > 0 ? rows[0] : null;
}

/**
 * Lấy tất cả tổ chức mà user có vai trò
 */
async function getUserOrganizations(userId) {
    const [orgs] = await pool.query(
        `SELECT
            om.id,
            om.organization_id,
            om.role_in_org,
            om.is_primary,
            om.assigned_date,
            o.name as organization_name,
            o.type as organization_type,
            o.status as organization_status
         FROM organization_manager om
         LEFT JOIN organization o ON om.organization_id = o.organization_id
         WHERE om.user_id = ?
         ORDER BY om.is_primary DESC, om.assigned_date DESC`,
        [userId]
    );
    return orgs;
}

/**
 * Lấy tất cả user trong tổ chức cùng vai trò
 */
async function getOrganizationUsers(organizationId, roleFilter = null) {
    let query = `
        SELECT
            om.id,
            om.user_id,
            om.role_in_org,
            om.is_primary,
            om.assigned_date,
            u.name as user_name,
            u.email as user_email,
            u.phone_number,
            u.avatar
        FROM organization_manager om
        JOIN user u ON om.user_id = u.user_id
        WHERE om.organization_id = ? AND u.is_deleted = 0
    `;

    const params = [organizationId];

    if (roleFilter) {
        query += ` AND om.role_in_org = ?`;
        params.push(roleFilter);
    }

    query += ` ORDER BY om.role_in_org DESC, om.assigned_date DESC`;

    const [users] = await pool.query(query, params);
    return users;
}

/**
 * Kiểm tra xem user có quyền gán vai trò cụ thể không
 * Quy tắc:
 * - Chỉ SUPER_ADMIN mới có thể gán SUPER_ADMIN
 * - CENTER_ADMIN có thể gán SCHOOL_ADMIN trở xuống
 * - SCHOOL_ADMIN có thể gán TEACHER trở xuống
 */
function canAssignRole(assignerRole, targetRole) {
    if (targetRole === 'SUPER_ADMIN') {
        return assignerRole === 'SUPER_ADMIN';
    }

    if (targetRole === 'CENTER_ADMIN') {
        return assignerRole === 'SUPER_ADMIN';
    }

    if (targetRole === 'SCHOOL_ADMIN') {
        return ['SUPER_ADMIN', 'CENTER_ADMIN'].includes(assignerRole);
    }

    if (targetRole === 'TEACHER') {
        return ['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN'].includes(assignerRole);
    }

    // STUDENT và USER có thể được gán bởi TEACHER trở lên
    return isRoleHigherOrEqual(assignerRole, 'TEACHER');
}

/**
 * Đặt tổ chức chính cho user
 */
async function setPrimaryOrganization(userId, organizationId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra xem user có vai trò trong tổ chức này không
        const [existingRole] = await connection.query(
            `SELECT id FROM organization_manager
             WHERE user_id = ? AND organization_id = ?`,
            [userId, organizationId]
        );

        if (existingRole.length === 0) {
            throw new Error('User không có vai trò trong tổ chức này');
        }

        // Bỏ đánh dấu chính cho tất cả tổ chức của user
        await connection.query(
            `UPDATE organization_manager
             SET is_primary = 0
             WHERE user_id = ?`,
            [userId]
        );

        // Đặt tổ chức chính mới
        await connection.query(
            `UPDATE organization_manager
             SET is_primary = 1
             WHERE user_id = ? AND organization_id = ?`,
            [userId, organizationId]
        );

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Lấy tổ chức chính của user
 */
async function getPrimaryOrganization(userId) {
    const [rows] = await pool.query(
        `SELECT
            om.organization_id,
            om.role_in_org,
            o.name as organization_name,
            o.type as organization_type
         FROM organization_manager om
         LEFT JOIN organization o ON om.organization_id = o.organization_id
         WHERE om.user_id = ? AND om.is_primary = 1
         LIMIT 1`,
        [userId]
    );

    return rows.length > 0 ? rows[0] : null;
}

/**
 * Kiểm tra user có phải thành viên của tổ chức không
 */
async function isOrgMember(userId, organizationId) {
    const [rows] = await pool.query(
        `SELECT COUNT(*) as count FROM organization_manager
         WHERE user_id = ? AND organization_id = ?`,
        [userId, organizationId]
    );

    return rows[0].count > 0;
}

/**
 * Lấy thống kê vai trò trong tổ chức
 */
async function getOrgRoleStats(organizationId) {
    const [stats] = await pool.query(
        `SELECT
            role_in_org,
            COUNT(*) as count
         FROM organization_manager
         WHERE organization_id = ?
         GROUP BY role_in_org`,
        [organizationId]
    );

    return stats;
}

module.exports = {
    ROLE_HIERARCHY,
    VALID_ROLES,
    isValidRole,
    isRoleHigherOrEqual,
    assignOrgRole,
    removeOrgRole,
    getUserRoleInOrg,
    getUserOrganizations,
    getOrganizationUsers,
    canAssignRole,
    setPrimaryOrganization,
    getPrimaryOrganization,
    isOrgMember,
    getOrgRoleStats
};
