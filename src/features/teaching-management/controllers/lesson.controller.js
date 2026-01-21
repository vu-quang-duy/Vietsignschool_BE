const lessonService = require('../services/lesson.services');

/**
 * Controller for lesson management endpoints
 */

// POST - Tạo bài học mới
const createLesson = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await lessonService.createLesson(req.body, userId);
    return res.status(201).json({
      success: true,
      data: result,
      message: 'Lesson created successfully',
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// GET - Lấy tất cả bài học (có phân trang)
const getLessons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      q = '',
      topic_id,
      classroom_id,
      difficulty_level,
      is_active = 1,
    } = req.query;

    const result = await lessonService.getLessons({
      page: parseInt(page),
      limit: parseInt(limit),
      q,
      topic_id: topic_id ? parseInt(topic_id) : null,
      classroom_id: classroom_id ? parseInt(classroom_id) : null,
      difficulty_level,
      is_active: is_active === 'false' ? 0 : 1,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// GET - Lấy bài học theo Topic ID
const getLessonsByTopic = async (req, res) => {
  try {
    const { topic_id } = req.params;

    const result = await lessonService.getLessonsByTopicId(parseInt(topic_id));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// GET - Lấy bài học theo Classroom ID
const getLessonsByClassroom = async (req, res) => {
  try {
    const { classroom_id } = req.params;

    const result = await lessonService.getLessonsByClassroomId(
      parseInt(classroom_id)
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// GET - Lấy bài học theo ID
const getLessonById = async (req, res) => {
  try {
    const { lesson_id } = req.params;

    const result = await lessonService.getLessonById(parseInt(lesson_id));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// PUT - Cập nhật bài học
const updateLesson = async (req, res) => {
  try {
    const { lesson_id } = req.params;
    const userId = req.user?.id;

    const result = await lessonService.updateLesson(
      parseInt(lesson_id),
      req.body,
      userId
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Lesson updated successfully',
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// PUT - Sắp xếp lại thứ tự bài học
const reorderLessons = async (req, res) => {
  try {
    const { topic_id } = req.params;
    const { lessons } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'lessons must be a non-empty array with lesson_id and order_number',
      });
    }

    const result = await lessonService.reorderLessons(
      parseInt(topic_id),
      lessons,
      userId
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Lessons reordered successfully',
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// DELETE - Xóa bài học
const deleteLesson = async (req, res) => {
  try {
    const { lesson_id } = req.params;
    const userId = req.user?.id;

    const result = await lessonService.deleteLesson(parseInt(lesson_id), userId);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// DELETE - Xóa tất cả bài học của một topic
const deleteLessonsByTopic = async (req, res) => {
  try {
    const { topic_id } = req.params;
    const userId = req.user?.id;

    const result = await lessonService.deleteLessonsByTopicId(
      parseInt(topic_id),
      userId
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Lessons deleted successfully',
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// GET - Lấy thống kê bài học
const getLessonStatistics = async (req, res) => {
  try {
    const { classroom_id, topic_id } = req.query;

    if (!classroom_id) {
      return res.status(400).json({
        success: false,
        error: 'classroom_id is required',
      });
    }

    const result = await lessonService.getLessonStatistics(
      parseInt(classroom_id),
      topic_id ? parseInt(topic_id) : null
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createLesson,
  getLessons,
  getLessonById,
  getLessonsByTopic,
  getLessonsByClassroom,
  updateLesson,
  reorderLessons,
  deleteLesson,
  deleteLessonsByTopic,
  getLessonStatistics,
};
