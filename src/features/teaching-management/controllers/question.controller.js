const questionService = require('../services/question.services');

/**
 * Question Management Controller
 * Handles HTTP requests for question management operations
 */

// Create new question
const createQuestion = async (req, res) => {
  try {
    const { content, explanation, class_room_id, image_location, video_location, created_by } = req.body;

    // Validation
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Question content is required',
        message: 'Nội dung câu hỏi là bắt buộc'
      });
    }

    const question = await questionService.createQuestion(
      content,
      explanation,
      class_room_id,
      image_location,
      video_location,
      created_by
    );

    return res.status(201).json({
      success: true,
      data: question,
      message: 'Question created successfully'
    });
  } catch (error) {
    console.error('Create question error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error creating question'
    });
  }
};

// Get all questions with pagination and filtering
const getQuestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const classroomId = req.query.classroom_id ? parseInt(req.query.classroom_id) : null;
    const creatorId = req.query.creator_id ? parseInt(req.query.creator_id) : null;

    const result = await questionService.getQuestions(limit, offset, classroomId, creatorId);

    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      message: 'Questions retrieved successfully'
    });
  } catch (error) {
    console.error('Get questions error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving questions'
    });
  }
};

// Get question by ID
const getQuestionById = async (req, res) => {
  try {
    const questionId = parseInt(req.params.question_id);

    if (!questionId || isNaN(questionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question ID',
        message: 'ID câu hỏi không hợp lệ'
      });
    }

    const question = await questionService.getQuestionById(questionId);

    return res.status(200).json({
      success: true,
      data: question,
      message: 'Question retrieved successfully'
    });
  } catch (error) {
    if (error.message === 'Question not found') {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
        message: 'Không tìm thấy câu hỏi'
      });
    }

    console.error('Get question error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving question'
    });
  }
};

// Get questions by classroom ID
const getQuestionsByClassroom = async (req, res) => {
  try {
    const classroomId = parseInt(req.params.classroom_id);
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!classroomId || isNaN(classroomId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid classroom ID',
        message: 'ID lớp học không hợp lệ'
      });
    }

    const result = await questionService.getQuestionsByClassroom(classroomId, limit, offset);

    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      message: 'Questions retrieved successfully'
    });
  } catch (error) {
    console.error('Get questions by classroom error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving questions'
    });
  }
};

// Get questions by creator ID
const getQuestionsByCreator = async (req, res) => {
  try {
    const creatorId = parseInt(req.params.creator_id);
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!creatorId || isNaN(creatorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid creator ID',
        message: 'ID người tạo không hợp lệ'
      });
    }

    const result = await questionService.getQuestionsByCreator(creatorId, limit, offset);

    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      message: 'Questions retrieved successfully'
    });
  } catch (error) {
    console.error('Get questions by creator error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving questions'
    });
  }
};

// Search questions by content
const searchQuestionsByContent = async (req, res) => {
  try {
    const content = req.query.content;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content parameter is required',
        message: 'Tham số nội dung là bắt buộc'
      });
    }

    const result = await questionService.searchQuestionsByContent(content, limit, offset);

    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      message: 'Questions retrieved successfully'
    });
  } catch (error) {
    console.error('Search questions error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error searching questions'
    });
  }
};

// Update question
const updateQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.question_id);
    const updates = req.body;

    if (!questionId || isNaN(questionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question ID',
        message: 'ID câu hỏi không hợp lệ'
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'Không có trường nào để cập nhật'
      });
    }

    const question = await questionService.updateQuestion(questionId, updates);

    return res.status(200).json({
      success: true,
      data: question,
      message: 'Question updated successfully'
    });
  } catch (error) {
    if (error.message === 'Question not found') {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
        message: 'Không tìm thấy câu hỏi'
      });
    }

    console.error('Update question error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error updating question'
    });
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.question_id);

    if (!questionId || isNaN(questionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid question ID',
        message: 'ID câu hỏi không hợp lệ'
      });
    }

    await questionService.deleteQuestion(questionId);

    return res.status(200).json({
      success: true,
      data: { question_id: questionId },
      message: 'Question deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Question not found') {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
        message: 'Không tìm thấy câu hỏi'
      });
    }

    console.error('Delete question error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error deleting question'
    });
  }
};

// Delete questions by classroom ID
const deleteQuestionsByClassroom = async (req, res) => {
  try {
    const classroomId = parseInt(req.params.classroom_id);

    if (!classroomId || isNaN(classroomId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid classroom ID',
        message: 'ID lớp học không hợp lệ'
      });
    }

    const result = await questionService.deleteQuestionsByClassroom(classroomId);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Questions deleted successfully'
    });
  } catch (error) {
    console.error('Delete questions error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error deleting questions'
    });
  }
};

// Get question statistics
const getQuestionStatistics = async (req, res) => {
  try {
    const classroomId = req.query.classroom_id ? parseInt(req.query.classroom_id) : null;

    const stats = await questionService.getQuestionStatistics(classroomId);

    return res.status(200).json({
      success: true,
      data: stats,
      message: 'Question statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get question statistics error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving question statistics'
    });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  getQuestionsByClassroom,
  getQuestionsByCreator,
  searchQuestionsByContent,
  updateQuestion,
  deleteQuestion,
  deleteQuestionsByClassroom,
  getQuestionStatistics
};
