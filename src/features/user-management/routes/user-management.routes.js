/**
 * User Management Routes
 */

const express = require('express');
const controller = require('../controllers/user-management.controller');
const { authRequired } = require('../../../middleware/auth.middleware');
const checkOrgRole = require('../../../middleware/orgRole.middleware');

const router = express.Router();

// =====================================================
// LOOKUP ENDPOINTS
// =====================================================

router.get('/roles', authRequired, controller.getRoles);
router.get('/grades', authRequired, controller.getGrades);
router.get('/statuses', authRequired, controller.getStatuses);
router.get('/organization-statuses', authRequired, controller.getOrganizationStatuses);

// =====================================================
// ORGANIZATION ENDPOINTS
// =====================================================

// GET - Danh sách và lọc
router.get('/organizations', authRequired, controller.getOrganizations);
router.get('/organizations/active', authRequired, controller.getActiveOrganizations);
router.get('/organizations/stats', authRequired, controller.getOrganizationsStats);
router.get('/organizations/by-city/:city', authRequired, controller.getOrganizationsByCity);
router.get('/organizations/by-type/:type', authRequired, controller.getOrganizationsByType);
router.get('/organizations/:id', authRequired, controller.getOrganizationById);

// POST - Tạo mới (Admin)
router.post(
  '/organizations',
  authRequired,
  checkOrgRole(['ADMIN', 'FACILITY_MANAGER']),
  controller.createOrganization
);

// PUT - Cập nhật (Admin)
router.put(
  '/organizations/:id',
  authRequired,
  checkOrgRole(['ADMIN', 'FACILITY_MANAGER']),
  controller.updateOrganization
);

// DELETE - Xóa (Admin only)
router.delete(
  '/organizations/:id',
  authRequired,
  checkOrgRole(['ADMIN']),
  controller.deleteOrganization
);

// =====================================================
// USER ENDPOINTS
// =====================================================

// GET - Danh sách và lọc
router.get('/users', authRequired, controller.getUsers);
router.get('/users/by-facility/:facilityId', authRequired, controller.getUsersByFacility);
router.get('/users/by-role/:role', authRequired, controller.getUsersByRole);
router.get('/facility-managers', authRequired, controller.getFacilityManagers);
router.get('/users/:id', authRequired, controller.getUserById);

// POST - Tạo mới (Admin, Facility Manager)
router.post(
  '/users',
  authRequired,
  checkOrgRole(['ADMIN', 'FACILITY_MANAGER']),
  controller.createUser
);

// PUT - Cập nhật (Admin, Facility Manager)
router.put(
  '/users/:id',
  authRequired,
  checkOrgRole(['ADMIN', 'FACILITY_MANAGER']),
  controller.updateUser
);

// PATCH - Cập nhật trạng thái
router.patch(
  '/users/:id/status',
  authRequired,
  checkOrgRole(['ADMIN', 'FACILITY_MANAGER']),
  controller.updateUserStatus
);

// DELETE - Xóa (Admin, Facility Manager)
router.delete(
  '/users/:id',
  authRequired,
  checkOrgRole(['ADMIN', 'FACILITY_MANAGER']),
  controller.deleteUser
);

// =====================================================
// STATISTICS
// =====================================================

router.get(
  '/statistics',
  authRequired,
  checkOrgRole(['ADMIN', 'FACILITY_MANAGER']),
  controller.getUserStatistics
);

// =====================================================
// PROFILE (Current User)
// =====================================================

router.get('/profile', authRequired, controller.getProfile);
router.put('/profile', authRequired, controller.updateProfile);

// =====================================================
// LEARNING TRACKING
// =====================================================

router.post('/tracking/view-lesson', authRequired, controller.viewLesson);
router.post('/tracking/view-vocabulary', authRequired, controller.viewVocabulary);
router.get('/tracking/learning-progress', authRequired, controller.getLearningProgress);

// NOTE: Organization Manager routes are in /src/routes/organizationManager.routes.js

module.exports = router;
