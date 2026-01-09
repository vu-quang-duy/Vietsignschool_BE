const express = require('express');
const {
    assignRole,
    removeRole,
    getUserRoles,
    getOrgUsers,
    setUserPrimaryOrg,
    getUserPrimaryOrg,
    getOrgStats,
    checkUserRole
} = require('../controllers/orgRole.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { hasMinOrgRole, hasOrgRole } = require('../middleware/orgRole.middleware');

const router = express.Router();

// ==================== VAI TRÒ TỔ CHỨC CỦA USER ====================

/**
 * @route   GET /org-roles/my-organizations
 * @desc    Lấy tất cả tổ chức mà user đã đăng nhập tham gia
 * @access  Private (Yêu cầu đăng nhập)
 */
router.get('/my-organizations', authRequired, async (req, res) => {
    const { getUserRoles: controller } = require('../controllers/orgRole.controller');
    req.params.userId = req.user.user_id;
    return controller(req, res);
});

/**
 * @route   GET /org-roles/primary
 * @desc    Lấy tổ chức chính của user
 * @access  Private (Yêu cầu đăng nhập)
 */
router.get('/primary', authRequired, getUserPrimaryOrg);

/**
 * @route   PUT /org-roles/set-primary
 * @desc    Đặt tổ chức chính cho user
 * @access  Private (Yêu cầu đăng nhập)
 */
router.put('/set-primary', authRequired, setUserPrimaryOrg);

/**
 * @route   GET /org-roles/check
 * @desc    Kiểm tra vai trò của user trong tổ chức cụ thể
 * @access  Private (Yêu cầu đăng nhập)
 * @query   organization_id (bắt buộc)
 */
router.get('/check', authRequired, checkUserRole);

// ==================== QUẢN LÝ TỔ CHỨC ====================

/**
 * @route   POST /org-roles/assign
 * @desc    Gán vai trò tổ chức cho user
 * @access  Private - Yêu cầu CENTER_ADMIN trở lên
 * @body    { organization_id, user_id, role_in_org, is_primary }
 */
router.post('/assign', authRequired, hasMinOrgRole('CENTER_ADMIN'), assignRole);

/**
 * @route   DELETE /org-roles/remove
 * @desc    Xóa vai trò tổ chức của user
 * @access  Private - Yêu cầu CENTER_ADMIN trở lên
 * @body    { organization_id, user_id }
 */
router.delete('/remove', authRequired, hasMinOrgRole('CENTER_ADMIN'), removeRole);

/**
 * @route   GET /org-roles/user/:userId
 * @desc    Lấy tất cả tổ chức của một user cụ thể (Chỉ Admin)
 * @access  Private - SUPER_ADMIN hoặc chính user đó
 */
router.get('/user/:userId', authRequired, getUserRoles);

/**
 * @route   GET /org-roles/organization/:organizationId
 * @desc    Lấy tất cả user trong tổ chức cùng vai trò
 * @access  Private - Phải là thành viên của tổ chức
 * @query   role (tùy chọn) - Lọc theo vai trò
 */
router.get('/organization/:organizationId', authRequired, getOrgUsers);

/**
 * @route   GET /org-roles/stats/:organizationId
 * @desc    Thống kê vai trò trong tổ chức
 * @access  Private - Yêu cầu SCHOOL_ADMIN trở lên
 */
router.get('/stats/:organizationId', authRequired, hasMinOrgRole('SCHOOL_ADMIN'), getOrgStats);

module.exports = router;
