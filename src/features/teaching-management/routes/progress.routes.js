// Progress Routes - Aggregator
const express = require('express');
const progressController = require('../controllers/progress.controller');
const { authRequired } = require('../../../middleware/auth.middleware');
const checkOrgRole = require('../../../middleware/orgRole.middleware');

const router = express.Router();

// Student's own progress
router.get(
  '/my-progress',
  authRequired,
  checkOrgRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getMyProgress
);

// Classroom progress summary (teacher/admin view)
router.get(
  '/classroom/:classroomId/summary',
  authRequired,
  checkOrgRole(['TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getClassroomProgressSummary
);

// Specific student's progress (teacher/admin view)
router.get(
  '/student/:studentId',
  authRequired,
  checkOrgRole(['TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getStudentProgress
);

// Student's exam history
router.get(
  '/student/:studentId/exams',
  authRequired,
  checkOrgRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getExamHistory
);

// Student's lesson progress
router.get(
  '/student/:studentId/lessons',
  authRequired,
  checkOrgRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getLessonProgress
);

// Student's vocabulary progress
router.get(
  '/student/:studentId/vocabularies',
  authRequired,
  checkOrgRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getVocabularyProgress
);

// Progress by classroom
router.get(
  '/student/:studentId/classroom/:classroomId',
  authRequired,
  checkOrgRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getProgressByClassroom
);

// Progress by date range
router.get(
  '/student/:studentId/date-range',
  authRequired,
  checkOrgRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getProgressByDateRange
);

// Progress comparison (student vs classroom average)
router.get(
  '/student/:studentId/classroom/:classroomId/comparison',
  authRequired,
  checkOrgRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getProgressComparison
);

// Learning trends
router.get(
  '/student/:studentId/trends',
  authRequired,
  checkOrgRole(['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  progressController.getLearningTrends
);

module.exports = router;
