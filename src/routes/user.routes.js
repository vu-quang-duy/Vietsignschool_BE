const express = require("express");
const {
    // User's own profile
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getActivityLog,
    uploadAvatar,
    updateAvatarUrl,

    // Admin functions
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    restoreUser,
    resetUserPassword,
    changeUserRole,

    // Account approval functions
    getPendingUsers,
    getApprovalStats,
    approveUser,
    rejectUser,
    bulkApproveUsers,
    getUserApprovalHistory
} = require("../controllers/user.controller");
const { authRequired } = require("../middleware/auth.middleware");
const { hasPermission } = require("../middleware/permission.middleware");
const { upload, handleUploadError, deleteOldAvatar } = require("../middleware/upload.middleware");

const router = express.Router();

// ==================== USER'S OWN PROFILE ROUTES ====================

// Profile routes
router.get("/profile", authRequired, getProfile);
router.put("/profile", authRequired, updateProfile);

// Account settings routes
router.put("/change-password", authRequired, changePassword);

// Avatar routes
// Upload avatar (multipart/form-data)
router.post(
    "/avatar/upload",
    authRequired,
    deleteOldAvatar,
    upload.single('avatar'),
    handleUploadError,
    uploadAvatar
);

// Update avatar by URL (application/json)
router.put("/avatar/url", authRequired, updateAvatarUrl);

router.delete("/account", authRequired, deleteAccount);

// Activity log
router.get("/activity-log", authRequired, getActivityLog);

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

// GET /user/all - Lấy danh sách tất cả user (Admin only)
router.get("/all", authRequired, hasPermission('USER_VIEW'), getAllUsers);

// POST /user/create - Tạo user mới (Admin only)
router.post("/create", authRequired, hasPermission('USER_CREATE'), createUser);

// GET /user/:userId - Lấy thông tin user theo ID (Admin only)
router.get("/:userId", authRequired, hasPermission('USER_VIEW'), getUserById);

// PUT /user/:userId - Cập nhật thông tin user (Admin only)
router.put("/:userId", authRequired, hasPermission('USER_UPDATE'), updateUser);

// DELETE /user/:userId - Xóa user (Admin only)
router.delete("/:userId", authRequired, hasPermission('USER_DELETE'), deleteUser);

// PUT /user/:userId/restore - Khôi phục user đã xóa (Admin only)
router.put("/:userId/restore", authRequired, hasPermission('USER_UPDATE'), restoreUser);

// PUT /user/:userId/reset-password - Reset mật khẩu user (Admin only)
router.put("/:userId/reset-password", authRequired, hasPermission('USER_UPDATE'), resetUserPassword);

// PUT /user/:userId/change-role - Thay đổi role của user (Admin only)
router.put("/:userId/change-role", authRequired, hasPermission('USER_ASSIGN_ROLE'), changeUserRole);

// ==================== ACCOUNT APPROVAL ROUTES ====================

// GET /users/pending - Danh sách tài khoản chờ phê duyệt (Admin only)
router.get("/pending", authRequired, hasPermission('USER_VIEW'), getPendingUsers);

// GET /users/approval-stats - Thống kê tài khoản theo trạng thái (Admin only)
router.get("/approval-stats", authRequired, hasPermission('USER_VIEW'), getApprovalStats);

// POST /users/bulk-approve - Phê duyệt nhiều tài khoản (Admin only)
router.post("/bulk-approve", authRequired, hasPermission('USER_UPDATE'), bulkApproveUsers);

// PUT /users/:userId/approve - Phê duyệt tài khoản (Admin only)
router.put("/:userId/approve", authRequired, hasPermission('USER_UPDATE'), approveUser);

// PUT /users/:userId/reject - Từ chối tài khoản (Admin only)
router.put("/:userId/reject", authRequired, hasPermission('USER_UPDATE'), rejectUser);

// GET /users/:userId/approval-history - Lịch sử phê duyệt (Admin only)
router.get("/:userId/approval-history", authRequired, hasPermission('USER_VIEW'), getUserApprovalHistory);

module.exports = router;
