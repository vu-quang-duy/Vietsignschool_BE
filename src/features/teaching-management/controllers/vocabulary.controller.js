const vocabularyService = require('../services/vocabulary.services');

/**
 * Controller for vocabulary management endpoints
 */

// POST - Tạo từ vựng mới
const createVocabulary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await vocabularyService.createVocabulary(req.body, userId);
    return res.status(201).json({
      success: true,
      data: result,
      message: 'Vocabulary created successfully',
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// GET - Lấy tất cả từ vựng (có phân trang)
const getVocabularies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      q = '',
      topic_id,
      classroom_id,
      vocabulary_type,
      is_private,
      is_active = 1,
    } = req.query;

    const result = await vocabularyService.getVocabularies({
      page: parseInt(page),
      limit: parseInt(limit),
      q,
      topic_id: topic_id ? parseInt(topic_id) : null,
      classroom_id: classroom_id ? parseInt(classroom_id) : null,
      vocabulary_type,
      is_private: is_private !== undefined ? parseInt(is_private) : null,
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

// GET - Lấy từ vựng theo Topic ID
const getVocabulariesByTopic = async (req, res) => {
  try {
    const { topic_id } = req.params;

    const result = await vocabularyService.getVocabulariesByTopicId(parseInt(topic_id));

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

// GET - Lấy từ vựng theo Classroom ID
const getVocabulariesByClassroom = async (req, res) => {
  try {
    const { classroom_id } = req.params;

    const result = await vocabularyService.getVocabulariesByClassroomId(
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

// GET - Lấy từ vựng theo loại (WORD, SENTENCE, PARAGRAPH)
const getVocabulariesByType = async (req, res) => {
  try {
    const { vocabulary_type } = req.params;
    const { topic_id, classroom_id, is_active } = req.query;

    const result = await vocabularyService.getVocabulariesByType(vocabulary_type, {
      topic_id: topic_id ? parseInt(topic_id) : null,
      classroom_id: classroom_id ? parseInt(classroom_id) : null,
      is_active: is_active !== undefined ? parseInt(is_active) : undefined,
    });

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

// GET - Lấy từ vựng theo ID
const getVocabularyById = async (req, res) => {
  try {
    const { vocabulary_id } = req.params;

    const result = await vocabularyService.getVocabularyById(parseInt(vocabulary_id));

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

// GET - Tìm từ vựng theo content
const getVocabularyByContent = async (req, res) => {
  try {
    const { content } = req.query;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content query parameter is required',
      });
    }

    const result = await vocabularyService.getVocabularyByContent(content);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Vocabulary not found',
      });
    }

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

// PUT - Cập nhật từ vựng
const updateVocabulary = async (req, res) => {
  try {
    const { vocabulary_id } = req.params;
    const userId = req.user?.id;

    const result = await vocabularyService.updateVocabulary(
      parseInt(vocabulary_id),
      req.body,
      userId
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Vocabulary updated successfully',
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// DELETE - Xóa từ vựng
const deleteVocabulary = async (req, res) => {
  try {
    const { vocabulary_id } = req.params;
    const userId = req.user?.id;

    const result = await vocabularyService.deleteVocabulary(parseInt(vocabulary_id), userId);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Vocabulary deleted successfully',
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// DELETE - Xóa tất cả từ vựng của một topic
const deleteVocabulariesByTopic = async (req, res) => {
  try {
    const { topic_id } = req.params;
    const userId = req.user?.id;

    const result = await vocabularyService.deleteVocabulariesByTopicId(
      parseInt(topic_id),
      userId
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Vocabularies deleted successfully',
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// GET - Lấy thống kê từ vựng
const getVocabularyStatistics = async (req, res) => {
  try {
    const { classroom_id, topic_id } = req.query;

    const result = await vocabularyService.getVocabularyStatistics(
      classroom_id ? parseInt(classroom_id) : null,
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
  createVocabulary,
  getVocabularies,
  getVocabularyById,
  getVocabulariesByTopic,
  getVocabulariesByClassroom,
  getVocabulariesByType,
  getVocabularyByContent,
  updateVocabulary,
  deleteVocabulary,
  deleteVocabulariesByTopic,
  getVocabularyStatistics,
};