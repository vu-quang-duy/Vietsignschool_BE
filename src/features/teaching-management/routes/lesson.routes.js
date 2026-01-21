// Lesson Routes - Aggregator
const express = require('express');
const lessonController = require('../controllers/lesson.controller');
const { authRequired } = require('../../../middleware/auth.middleware');
const checkOrgRole = require('../../../middleware/orgRole.middleware');

const router = express.Router();

router.post(
  '/',
  authRequired,
  checkOrgRole(['TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  lessonController.createLesson
);

router.get('/', authRequired, lessonController.getLessons);
router.get('/:lessonId', authRequired, lessonController.getLessonById);

router.put(
  '/:lessonId',
  authRequired,
  checkOrgRole(['TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  lessonController.updateLesson
);

router.delete(
  '/:lessonId',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  lessonController.deleteLesson
);

router.delete(
  '/topic/:topicId',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  lessonController.deleteLessonsByTopic
);

module.exports = router;
