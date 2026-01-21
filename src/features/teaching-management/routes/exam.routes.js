// Exam Routes - Aggregator
const express = require('express');
const examController = require('../controllers/exam.controller');
const { authRequired } = require('../../../middleware/auth.middleware');
const checkOrgRole = require('../../../middleware/orgRole.middleware');

const router = express.Router();

router.post(
  '/',
  authRequired,
  checkOrgRole(['TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  examController.createExam
);

router.get('/', authRequired, examController.getExams);
router.get('/statistics', authRequired, examController.getExamStatistics);
router.get('/classroom/:classroom_id', authRequired, examController.getExamsByClassroom);
router.get('/creator/:creator_id', authRequired, examController.getExamsByCreator);
router.get('/type/:exam_type', authRequired, examController.getExamsByType);
router.post('/:exam_id/submit', authRequired, checkOrgRole(['STUDENT']), examController.submitExam);
router.get('/:exam_id/results', authRequired, examController.getExamResults);
router.get('/student/:student_id/attempts', authRequired, examController.getStudentExamAttempts);
router.get('/:exam_id', authRequired, examController.getExamById);

router.put(
  '/:exam_id',
  authRequired,
  checkOrgRole(['TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  examController.updateExam
);

router.delete(
  '/:exam_id',
  authRequired,
  checkOrgRole(['TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  examController.deleteExam
);

module.exports = router;
