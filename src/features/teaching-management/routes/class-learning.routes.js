/**
 * Class Learning Routes
 * API endpoints cho học sinh học tập theo lớp
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/class-learning.controller');
const { authRequired } = require('../../../middleware/auth.middleware');

// =====================================================
// Tham gia / Rời lớp
// =====================================================

// POST /class-learning/join - Tham gia lớp bằng mã lớp
router.post('/join', authRequired, controller.joinClass);

// GET /class-learning/my-classes - Danh sách lớp của tôi
router.get('/my-classes', authRequired, controller.getMyClasses);

// POST /class-learning/:classroomId/leave - Rời khỏi lớp
router.post('/:classroomId/leave', authRequired, controller.leaveClass);

// =====================================================
// Nội dung học tập theo lớp
// =====================================================

// GET /class-learning/:classroomId/lessons - Danh sách bài học
router.get('/:classroomId/lessons', authRequired, controller.getLessons);

// GET /class-learning/:classroomId/topics - Danh sách chủ đề
router.get('/:classroomId/topics', authRequired, controller.getTopics);

// GET /class-learning/:classroomId/progress - Tiến độ học tập
router.get('/:classroomId/progress', authRequired, controller.getClassProgress);

// =====================================================
// Chi tiết nội dung
// =====================================================

// GET /class-learning/lessons/:lessonId - Chi tiết bài học
router.get('/lessons/:lessonId', authRequired, controller.getLessonDetail);

// POST /class-learning/lessons/:lessonId/complete - Đánh dấu hoàn thành
router.post('/lessons/:lessonId/complete', authRequired, controller.markLessonComplete);

// GET /class-learning/topics/:topicId/vocabularies - Từ vựng theo chủ đề
router.get('/topics/:topicId/vocabularies', authRequired, controller.getVocabulariesByTopic);

// GET /class-learning/vocabularies/:vocabularyId - Chi tiết từ vựng
router.get('/vocabularies/:vocabularyId', authRequired, controller.getVocabularyDetail);

module.exports = router;
