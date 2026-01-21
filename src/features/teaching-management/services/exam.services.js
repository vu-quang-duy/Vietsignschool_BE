const db = require('../../../db');

/**
 * Exam Management Services
 * Manages CRUD operations for exams with support for exam submission and results
 */

// Create new exam
const createExam = async (name, description, examType, classroomId, creatorId, durationMinutes, totalPoints, passingScore) => {
  try {
    const query = `
      INSERT INTO exam 
      (name, description, exam_type, class_room_id, created_by, duration_minutes, total_points, passing_score, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;
    
    const [result] = await db.execute(query, [
      name,
      description || null,
      examType || 'MULTIPLE_CHOICE',
      classroomId || null,
      creatorId || null,
      durationMinutes || 60,
      totalPoints || 100,
      passingScore || 50
    ]);

    return {
      exam_id: result.insertId,
      name,
      description,
      exam_type: examType,
      class_room_id: classroomId,
      created_by: creatorId,
      duration_minutes: durationMinutes,
      total_points: totalPoints,
      passing_score: passingScore,
      is_active: 1,
      created_at: new Date(),
      updated_at: new Date()
    };
  } catch (error) {
    throw error;
  }
};

// Get all exams with pagination and filtering
const getExams = async (limit = 10, offset = 0, classroomId = null, creatorId = null, examType = null, isActive = null) => {
  try {
    let query = 'SELECT * FROM exam WHERE 1=1';
    const params = [];

    if (classroomId !== null) {
      query += ' AND class_room_id = ?';
      params.push(classroomId);
    }

    if (creatorId !== null) {
      query += ' AND created_by = ?';
      params.push(creatorId);
    }

    if (examType !== null) {
      query += ' AND exam_type = ?';
      params.push(examType);
    }

    if (isActive !== null) {
      query += ' AND is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [exams] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM exam WHERE 1=1';
    const countParams = [];

    if (classroomId !== null) {
      countQuery += ' AND class_room_id = ?';
      countParams.push(classroomId);
    }

    if (creatorId !== null) {
      countQuery += ' AND created_by = ?';
      countParams.push(creatorId);
    }

    if (examType !== null) {
      countQuery += ' AND exam_type = ?';
      countParams.push(examType);
    }

    if (isActive !== null) {
      countQuery += ' AND is_active = ?';
      countParams.push(isActive ? 1 : 0);
    }

    const [[{ total }]] = await db.execute(countQuery, countParams);

    return {
      data: exams,
      total,
      limit,
      offset
    };
  } catch (error) {
    throw error;
  }
};

// Get exam by ID
const getExamById = async (examId) => {
  try {
    const query = 'SELECT * FROM exam WHERE exam_id = ?';
    const [[exam]] = await db.execute(query, [examId]);

    if (!exam) {
      throw new Error('Exam not found');
    }

    return exam;
  } catch (error) {
    throw error;
  }
};

// Get exams by classroom ID
const getExamsByClassroom = async (classroomId, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT * FROM exam 
      WHERE class_room_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [exams] = await db.execute(query, [classroomId, limit, offset]);

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM exam WHERE class_room_id = ? AND is_active = 1',
      [classroomId]
    );

    return {
      data: exams,
      total,
      limit,
      offset
    };
  } catch (error) {
    throw error;
  }
};

// Get exams by creator ID
const getExamsByCreator = async (creatorId, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT * FROM exam 
      WHERE created_by = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [exams] = await db.execute(query, [creatorId, limit, offset]);

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM exam WHERE created_by = ?',
      [creatorId]
    );

    return {
      data: exams,
      total,
      limit,
      offset
    };
  } catch (error) {
    throw error;
  }
};

// Get exams by type
const getExamsByType = async (examType, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT * FROM exam 
      WHERE exam_type = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [exams] = await db.execute(query, [examType, limit, offset]);

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM exam WHERE exam_type = ? AND is_active = 1',
      [examType]
    );

    return {
      data: exams,
      total,
      limit,
      offset
    };
  } catch (error) {
    throw error;
  }
};

// Update exam
const updateExam = async (examId, updates) => {
  try {
    // Check if exam exists
    const [existingExam] = await db.execute(
      'SELECT * FROM exam WHERE exam_id = ?',
      [examId]
    );

    if (existingExam.length === 0) {
      throw new Error('Exam not found');
    }

    const allowedFields = ['name', 'description', 'exam_type', 'class_room_id', 'created_by', 'duration_minutes', 'total_points', 'passing_score', 'is_active'];
    const updateFields = Object.keys(updates)
      .filter(key => allowedFields.includes(key) && updates[key] !== undefined)
      .map(key => `${key} = ?`);

    if (updateFields.length === 0) {
      return existingExam[0];
    }

    const updateValues = Object.keys(updates)
      .filter(key => allowedFields.includes(key) && updates[key] !== undefined)
      .map(key => {
        if (key === 'is_active') {
          return updates[key] ? 1 : 0;
        }
        return updates[key];
      });

    const query = `
      UPDATE exam 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE exam_id = ?
    `;

    await db.execute(query, [...updateValues, examId]);

    return getExamById(examId);
  } catch (error) {
    throw error;
  }
};

// Delete exam
const deleteExam = async (examId) => {
  try {
    const [exam] = await db.execute(
      'SELECT * FROM exam WHERE exam_id = ?',
      [examId]
    );

    if (exam.length === 0) {
      throw new Error('Exam not found');
    }

    // Hard delete
    await db.execute(
      'DELETE FROM exam WHERE exam_id = ?',
      [examId]
    );

    return true;
  } catch (error) {
    throw error;
  }
};

// Delete exams by classroom ID
const deleteExamsByClassroom = async (classroomId) => {
  try {
    const [exams] = await db.execute(
      'SELECT exam_id FROM exam WHERE class_room_id = ?',
      [classroomId]
    );

    if (exams.length === 0) {
      return { deletedCount: 0 };
    }

    await db.execute(
      'DELETE FROM exam WHERE class_room_id = ?',
      [classroomId]
    );

    return { deletedCount: exams.length };
  } catch (error) {
    throw error;
  }
};

// Submit exam (record student's exam attempt)
const submitExam = async (examId, studentId, score, answers, timeSpent) => {
  try {
    const query = `
      INSERT INTO user_exam_mapping 
      (exam_id, user_id, score, answers, time_spent_minutes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const [result] = await db.execute(query, [
      examId,
      studentId,
      score || 0,
      answers ? JSON.stringify(answers) : null,
      timeSpent || 0
    ]);

    return {
      exam_attempt_id: result.insertId,
      exam_id: examId,
      user_id: studentId,
      score,
      time_spent_minutes: timeSpent,
      created_at: new Date()
    };
  } catch (error) {
    throw error;
  }
};

// Get exam results for a student
const getExamResults = async (examId, studentId = null) => {
  try {
    let query = `
      SELECT uem.*, u.name as student_name, u.email as student_email, e.total_points, e.passing_score
      FROM user_exam_mapping uem
      JOIN exam e ON uem.exam_id = e.exam_id
      LEFT JOIN user u ON uem.user_id = u.user_id
      WHERE uem.exam_id = ?
    `;
    const params = [examId];

    if (studentId !== null) {
      query += ' AND uem.user_id = ?';
      params.push(studentId);
    }

    query += ' ORDER BY uem.created_at DESC';

    const [results] = await db.execute(query, params);

    return results;
  } catch (error) {
    throw error;
  }
};

// Get exam statistics
const getExamStatistics = async (classroomId = null, examType = null) => {
  try {
    let query = 'SELECT COUNT(*) as total_exams FROM exam WHERE 1=1';
    const params = [];

    if (classroomId !== null) {
      query += ' AND class_room_id = ?';
      params.push(classroomId);
    }

    if (examType !== null) {
      query += ' AND exam_type = ?';
      params.push(examType);
    }

    const [[{ total_exams }]] = await db.execute(query, params);

    // Get count of active exams
    let activeQuery = 'SELECT COUNT(*) as active_exams FROM exam WHERE is_active = 1';
    const activeParams = [];

    if (classroomId !== null) {
      activeQuery += ' AND class_room_id = ?';
      activeParams.push(classroomId);
    }

    if (examType !== null) {
      activeQuery += ' AND exam_type = ?';
      activeParams.push(examType);
    }

    const [[{ active_exams }]] = await db.execute(activeQuery, activeParams);

    // Get count of inactive exams
    let inactiveQuery = 'SELECT COUNT(*) as inactive_exams FROM exam WHERE is_active = 0';
    const inactiveParams = [];

    if (classroomId !== null) {
      inactiveQuery += ' AND class_room_id = ?';
      inactiveParams.push(classroomId);
    }

    if (examType !== null) {
      inactiveQuery += ' AND exam_type = ?';
      inactiveParams.push(examType);
    }

    const [[{ inactive_exams }]] = await db.execute(inactiveQuery, inactiveParams);

    return {
      total_exams,
      active_exams,
      inactive_exams
    };
  } catch (error) {
    throw error;
  }
};

// Get student's exam attempts
const getStudentExamAttempts = async (studentId, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT uem.*, e.name as exam_name, e.total_points, e.passing_score
      FROM user_exam_mapping uem
      JOIN exam e ON uem.exam_id = e.exam_id
      WHERE uem.user_id = ?
      ORDER BY uem.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [attempts] = await db.execute(query, [studentId, limit, offset]);

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM user_exam_mapping WHERE user_id = ?',
      [studentId]
    );

    return {
      data: attempts,
      total,
      limit,
      offset
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  getExamsByClassroom,
  getExamsByCreator,
  getExamsByType,
  updateExam,
  deleteExam,
  deleteExamsByClassroom,
  submitExam,
  getExamResults,
  getExamStatistics,
  getStudentExamAttempts
};
