/**
 * User Management Controller

 */

const services = require('../services/user-management.service');

// =====================================================
// USER MANAGEMENT
// =====================================================

/**
 * POST /user-management/users
 */
async function createUser(req, res) {
  try {
    const payload = req.body || {};
    const createdBy = req.user?.email || 'system';
    const result = await services.createUser(payload, createdBy);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/users
 * Query: page, limit, q, role, status, facilityId, grade
 */
async function getUsers(req, res) {
  try {
    const { page, limit, q, role, status, facilityId, grade } = req.query || {};
    const result = await services.getUsers({ page, limit, q, role, status, facilityId, grade });
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/users/:id
 */
async function getUserById(req, res) {
  try {
    const user = await services.getUserById(req.params.id);
    return res.json(user);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * PUT /user-management/users/:id
 */
async function updateUser(req, res) {
  try {
    const user = await services.updateUser(req.params.id, req.body, req.user?.email);
    return res.json({ message: 'Cập nhật thành công', user });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * DELETE /user-management/users/:id
 */
async function deleteUser(req, res) {
  try {
    const result = await services.deleteUser(req.params.id, req.user?.email);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * PATCH /user-management/users/:id/status
 */
async function updateUserStatus(req, res) {
  try {
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ message: 'Thiếu trạng thái' });
    }
    const result = await services.updateUserStatus(req.params.id, status, req.user?.email);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/users/by-facility/:facilityId
 */
async function getUsersByFacility(req, res) {
  try {
    const users = await services.getUsersByFacility(req.params.facilityId);
    return res.json({ users });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/users/by-role/:role
 */
async function getUsersByRole(req, res) {
  try {
    const users = await services.getUsersByRole(req.params.role);
    return res.json({ users });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/facility-managers
 */
async function getFacilityManagers(req, res) {
  try {
    const managers = await services.getFacilityManagers();
    return res.json({ managers });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// =====================================================
// ORGANIZATION MANAGEMENT
// =====================================================

/**
 * GET /user-management/organizations
 * Query: status, provinceCode, q, page, limit
 */
async function getOrganizations(req, res) {
  try {
    const { status, provinceCode, q, page, limit } = req.query || {};
    const result = await services.getOrganizations({ status, provinceCode, q, page, limit });
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/organizations/:id
 */
async function getOrganizationById(req, res) {
  try {
    const org = await services.getOrganizationById(req.params.id);
    return res.json(org);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * POST /user-management/organizations
 */
async function createOrganization(req, res) {
  try {
    const result = await services.createOrganization(req.body, req.user?.email);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * PUT /user-management/organizations/:id
 */
async function updateOrganization(req, res) {
  try {
    const org = await services.updateOrganization(req.params.id, req.body, req.user?.email);
    return res.json({ message: 'Cập nhật thành công', organization: org });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * DELETE /user-management/organizations/:id
 */
async function deleteOrganization(req, res) {
  try {
    const result = await services.deleteOrganization(req.params.id, req.user?.email);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/organizations/by-city/:city
 */
async function getOrganizationsByCity(req, res) {
  try {
    const orgs = await services.getOrganizationsByCity(req.params.city);
    return res.json({ organizations: orgs });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/organizations/by-type/:type
 */
async function getOrganizationsByType(req, res) {
  try {
    const orgs = await services.getOrganizationsByType(req.params.type);
    return res.json({ organizations: orgs });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/organizations/active
 */
async function getActiveOrganizations(req, res) {
  try {
    const orgs = await services.getActiveOrganizations();
    return res.json({ organizations: orgs });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/organizations/stats
 */
async function getOrganizationsStats(req, res) {
  try {
    const stats = await services.getOrganizationsStats();
    return res.json(stats);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// =====================================================
// LOOKUP DATA
// =====================================================

/**
 * GET /user-management/roles
 */
async function getRoles(req, res) {
  try {
    const roles = await services.getRoles();
    return res.json({ roles });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/grades
 */
async function getGrades(req, res) {
  const grades = [
    { value: 1, label: 'Lớp 1' },
    { value: 2, label: 'Lớp 2' },
    { value: 3, label: 'Lớp 3' },
    { value: 4, label: 'Lớp 4' },
    { value: 5, label: 'Lớp 5' },
  ];
  return res.json({ grades });
}

/**
 * GET /user-management/statuses
 */
async function getStatuses(req, res) {
  const statuses = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' },
  ];
  return res.json({ statuses });
}

/**
 * GET /user-management/organization-statuses
 */
async function getOrganizationStatuses(req, res) {
    const statuses = [
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Tạm ngưng' },
    { value: 'maintenance', label: 'Bảo trì' },
  ];
  return res.json({ statuses });
}

/**
 * GET /user-management/statistics
 * Query: facilityId
 */
async function getUserStatistics(req, res) {
  try {
    const { facilityId } = req.query || {};
    const statistics = await services.getUserStatistics({ facilityId });
    return res.json({ statistics });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// =====================================================
// PROFILE & LEARNING TRACKING
// =====================================================

/**
 * GET /user-management/profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await services.getProfile(userId);
    return res.json(user);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * PUT /user-management/profile
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await services.updateProfile(userId, req.body);
    return res.json({ message: 'Cập nhật thành công', user });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * POST /user-management/tracking/view-lesson
 */
async function viewLesson(req, res) {
  try {
    const studentId = req.user?.user_id;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
    const result = await services.viewLesson(studentId, req.body?.lessonId);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * POST /user-management/tracking/view-vocabulary
 */
async function viewVocabulary(req, res) {
  try {
    const studentId = req.user?.user_id;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
    const result = await services.viewVocabulary(studentId, req.body?.vocabularyId);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

/**
 * GET /user-management/tracking/learning-progress
 */
async function getLearningProgress(req, res) {
  try {
    const studentId = req.user?.user_id;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
    const result = await services.getStudentLearningProgress(studentId);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

// NOTE: Organization Manager controllers are in /src/controllers/organizationManager.controller.js

module.exports = {
  // Users
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUsersByFacility,
  getUsersByRole,
  getFacilityManagers,
  // Organizations
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationsByCity,
  getOrganizationsByType,
  getActiveOrganizations,
  getOrganizationsStats,
  // Lookup
  getRoles,
  getGrades,
  getStatuses,
  getOrganizationStatuses,
  getUserStatistics,
  // Profile & Tracking
  getProfile,
  updateProfile,
  viewLesson,
  viewVocabulary,
  getLearningProgress,
};
