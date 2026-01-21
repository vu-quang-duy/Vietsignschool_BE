const db = require('../../../db');

/**
 * Question Management Services
 * Manages CRUD operations for questions with support for organization-based access control
 */

// Create new question
const createQuestion = async (content, explanation, classroomId, imageLocation, videoLocation, creatorId) => {
  try {
    const query = `
      INSERT INTO question 
      (content, explanation, class_room_id, image_location, video_location, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const [result] = await db.execute(query, [
      content,
      explanation || null,
      classroomId || null,
      imageLocation || null,
      videoLocation || null,
      creatorId || null
    ]);

    return {
      question_id: result.insertId,
      content,
      explanation,
      class_room_id: classroomId,
      image_location: imageLocation,
      video_location: videoLocation,
      created_by: creatorId,
      created_at: new Date(),
      updated_at: new Date()
    };
  } catch (error) {
    throw error;
  }
};

// Get all questions with pagination and filtering
const getQuestions = async (limit = 10, offset = 0, classroomId = null, creatorId = null) => {
  try {
    let query = 'SELECT * FROM question WHERE 1=1';
    const params = [];

    if (classroomId !== null) {
      query += ' AND class_room_id = ?';
      params.push(classroomId);
    }

    if (creatorId !== null) {
      query += ' AND created_by = ?';
      params.push(creatorId);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [questions] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM question WHERE 1=1';
    const countParams = [];

    if (classroomId !== null) {
      countQuery += ' AND class_room_id = ?';
      countParams.push(classroomId);
    }

    if (creatorId !== null) {
      countQuery += ' AND created_by = ?';
      countParams.push(creatorId);
    }

    const [[{ total }]] = await db.execute(countQuery, countParams);

    return {
      data: questions,
      total,
      limit,
      offset
    };
  } catch (error) {
    throw error;
  }
};

// Get question by ID
const getQuestionById = async (questionId) => {
  try {
    const query = 'SELECT * FROM question WHERE question_id = ?';
    const [[question]] = await db.execute(query, [questionId]);

    if (!question) {
      throw new Error('Question not found');
    }

    return question;
  } catch (error) {
    throw error;
  }
};

// Get questions by classroom ID
const getQuestionsByClassroom = async (classroomId, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT * FROM question 
      WHERE class_room_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [questions] = await db.execute(query, [classroomId, limit, offset]);

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM question WHERE class_room_id = ?',
      [classroomId]
    );

    return {
      data: questions,
      total,
      limit,
      offset
    };
  } catch (error) {
    throw error;
  }
};

// Get questions by creator ID
const getQuestionsByCreator = async (creatorId, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT * FROM question 
      WHERE created_by = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [questions] = await db.execute(query, [creatorId, limit, offset]);

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM question WHERE created_by = ?',
      [creatorId]
    );

    return {
      data: questions,
      total,
      limit,
      offset
    };
  } catch (error) {
    throw error;
  }
};

// Search questions by content
const searchQuestionsByContent = async (content, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT * FROM question 
      WHERE content LIKE ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [questions] = await db.execute(query, [`%${content}%`, limit, offset]);

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM question WHERE content LIKE ?',
      [`%${content}%`]
    );

    return {
      data: questions,
      total,
      limit,
      offset
    };
  } catch (error) {
    throw error;
  }
};

// Update question
const updateQuestion = async (questionId, updates) => {
  try {
    // Check if question exists
    const [existingQuestion] = await db.execute(
      'SELECT * FROM question WHERE question_id = ?',
      [questionId]
    );

    if (existingQuestion.length === 0) {
      throw new Error('Question not found');
    }

    const allowedFields = ['content', 'explanation', 'class_room_id', 'image_location', 'video_location', 'created_by'];
    const updateFields = Object.keys(updates)
      .filter(key => allowedFields.includes(key) && updates[key] !== undefined)
      .map(key => `${key} = ?`);

    if (updateFields.length === 0) {
      return existingQuestion[0];
    }

    const updateValues = Object.keys(updates)
      .filter(key => allowedFields.includes(key) && updates[key] !== undefined)
      .map(key => updates[key]);

    const query = `
      UPDATE question 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE question_id = ?
    `;

    await db.execute(query, [...updateValues, questionId]);

    return getQuestionById(questionId);
  } catch (error) {
    throw error;
  }
};

// Delete question
const deleteQuestion = async (questionId) => {
  try {
    const [question] = await db.execute(
      'SELECT * FROM question WHERE question_id = ?',
      [questionId]
    );

    if (question.length === 0) {
      throw new Error('Question not found');
    }

    // Hard delete
    await db.execute(
      'DELETE FROM question WHERE question_id = ?',
      [questionId]
    );

    return true;
  } catch (error) {
    throw error;
  }
};

// Delete questions by classroom ID
const deleteQuestionsByClassroom = async (classroomId) => {
  try {
    const [questions] = await db.execute(
      'SELECT question_id FROM question WHERE class_room_id = ?',
      [classroomId]
    );

    if (questions.length === 0) {
      return { deletedCount: 0 };
    }

    await db.execute(
      'DELETE FROM question WHERE class_room_id = ?',
      [classroomId]
    );

    return { deletedCount: questions.length };
  } catch (error) {
    throw error;
  }
};

// Get question statistics
const getQuestionStatistics = async (classroomId = null) => {
  try {
    let query = 'SELECT COUNT(*) as total_questions FROM question WHERE 1=1';
    const params = [];

    if (classroomId !== null) {
      query += ' AND class_room_id = ?';
      params.push(classroomId);
    }

    const [[{ total_questions }]] = await db.execute(query, params);

    // Get count of questions with image
    let imageQuery = 'SELECT COUNT(*) as questions_with_image FROM question WHERE image_location IS NOT NULL';
    const imageParams = [];

    if (classroomId !== null) {
      imageQuery += ' AND class_room_id = ?';
      imageParams.push(classroomId);
    }

    const [[{ questions_with_image }]] = await db.execute(imageQuery, imageParams);

    // Get count of questions with video
    let videoQuery = 'SELECT COUNT(*) as questions_with_video FROM question WHERE video_location IS NOT NULL';
    const videoParams = [];

    if (classroomId !== null) {
      videoQuery += ' AND class_room_id = ?';
      videoParams.push(classroomId);
    }

    const [[{ questions_with_video }]] = await db.execute(videoQuery, videoParams);

    return {
      total_questions,
      questions_with_image,
      questions_with_video
    };
  } catch (error) {
    throw error;
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
