/**
 * User Management Feature
 * Quản lý người dùng: vai trò, cơ sở giáo dục, trạng thái, lớp học
 */

const express = require('express');
const router = express.Router();

const userManagementRoutes = require('./routes/user-management.routes');

// Mount all user management routes
router.use('/', userManagementRoutes);

module.exports = router;
