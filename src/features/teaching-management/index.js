/**
 * Teaching Management Routes Aggregator
 * Central point for all teaching management related routes
 */

const express = require('express');
const router = express.Router();

// Import all teaching management routes
const classroomRoutes = require('./routes/classroom.routes');
const lessonRoutes = require('./routes/lesson.routes');
const vocabularyRoutes = require('./routes/vocabulary.routes');
const topicRoutes = require('./routes/topic.routes');
const questionRoutes = require('./routes/question.routes');
const examRoutes = require('./routes/exam.routes');
const progressRoutes = require('./routes/progress.routes');
const classLearningRoutes = require('./routes/class-learning.routes');

// Mount all routes
router.use('/classrooms', classroomRoutes);
router.use('/lessons', lessonRoutes);
router.use('/vocabularies', vocabularyRoutes);
router.use('/topics', topicRoutes);
router.use('/questions', questionRoutes);
router.use('/exams', examRoutes);
router.use('/progress', progressRoutes);
router.use('/class-learning', classLearningRoutes);

module.exports = router;
