const express = require('express');
const router = express.Router();

const {
  createClassroom,
  getClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom,
  addStudentToClassroom,
  removeStudentFromClassroom,
  getClassroomStudents
} = require('../controllers/classroom.controller');

const { authRequired } = require('../../../middleware/auth.middleware');
const checkOrgRole = require('../../../middleware/orgRole.middleware');

// Create classroom (teacher/admin)
router.post(
  '/',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  createClassroom
);

// Get all classrooms (all authenticated users)
router.get('/', authRequired, getClassrooms);

// Get classroom details (all authenticated users)
router.get('/:classroomId', authRequired, getClassroomById);

// Update classroom (teacher/admin)
router.put(
  '/:classroomId',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  updateClassroom
);

// Delete classroom (admin)
router.delete(
  '/:classroomId',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  deleteClassroom
);

// Add student to classroom (teacher/admin)
router.post(
  '/:classroomId/students',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  addStudentToClassroom
);

// Get classroom students (teacher/admin)
router.get(
  '/:classroomId/students',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  getClassroomStudents
);

// Remove student from classroom (admin)
router.delete(
  '/:classroomId/students',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  removeStudentFromClassroom
);

module.exports = router;
