/**
 * Class Learning Controller
 * API endpoints cho học sinh học tập theo lớp
 */

const services = require('../services/class-learning.service');

// =====================================================
// STUDENT: Tham gia / Rời lớp
// =====================================================

/**
 * POST /class-learning/join
 * Học sinh tham gia lớp bằng mã lớp
 */
async function joinClass(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { classCode } = req.body || {};

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!classCode) {
      return res.status(400).json({ message: 'Vui lòng nhập mã lớp' });
    }

    const result = await services.joinClassByCode(studentId, classCode);
    return res.status(201).json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

/**
 * POST /class-learning/:classroomId/leave
 * Học sinh rời lớp
 */
async function leaveClass(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { classroomId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await services.leaveClass(studentId, classroomId);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

/**
 * GET /class-learning/my-classes
 * Lấy danh sách lớp của học sinh
 */
async function getMyClasses(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { page, limit } = req.query || {};

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await services.getMyClasses(studentId, { page, limit });
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

// =====================================================
// LEARNING: Nội dung học tập
// =====================================================

/**
 * GET /class-learning/:classroomId/lessons
 * Lấy danh sách bài học theo lớp
 */
async function getLessons(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { classroomId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await services.getLessonsByClass(classroomId, studentId);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

/**
 * GET /class-learning/lessons/:lessonId
 * Lấy chi tiết bài học
 */
async function getLessonDetail(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { lessonId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await services.getLessonDetail(lessonId, studentId);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

/**
 * GET /class-learning/:classroomId/topics
 * Lấy danh sách chủ đề theo lớp
 */
async function getTopics(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { classroomId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await services.getTopicsByClass(classroomId, studentId);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

/**
 * GET /class-learning/topics/:topicId/vocabularies
 * Lấy từ vựng theo chủ đề
 */
async function getVocabulariesByTopic(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { topicId } = req.params;
    const { page, limit } = req.query || {};

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await services.getVocabulariesByTopic(topicId, studentId, { page, limit });
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

/**
 * GET /class-learning/vocabularies/:vocabularyId
 * Xem chi tiết từ vựng
 */
async function getVocabularyDetail(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { vocabularyId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await services.getVocabularyDetail(vocabularyId, studentId);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

// =====================================================
// PROGRESS: Tiến độ học tập
// =====================================================

/**
 * GET /class-learning/:classroomId/progress
 * Lấy tiến độ học tập theo lớp
 */
async function getClassProgress(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { classroomId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await services.getClassProgress(studentId, classroomId);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

/**
 * POST /class-learning/lessons/:lessonId/complete
 * Đánh dấu hoàn thành bài học
 */
async function markLessonComplete(req, res) {
  try {
    const studentId = req.user?.user_id;
    const { lessonId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await services.markLessonComplete(studentId, lessonId);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message });
  }
}

module.exports = {
  // Tham gia / Rời lớp
  joinClass,
  leaveClass,
  getMyClasses,
  // Nội dung học tập
  getLessons,
  getLessonDetail,
  getTopics,
  getVocabulariesByTopic,
  getVocabularyDetail,
  // Tiến độ
  getClassProgress,
  markLessonComplete,
};
