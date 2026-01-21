const db = require("../../../db");

// Get student's own learning progress
const getStudentProgress = async (studentId) => {
  try {
    // Get student info
    const studentQuery = "SELECT id, full_name, email FROM user WHERE id = ?";
    const studentResult = await db.query(studentQuery, [studentId]);

    if (!studentResult[0] || studentResult[0].length === 0) {
      return null;
    }

    const student = studentResult[0][0];

    // Get exam attempts and scores
    const examQuery = `
      SELECT 
        COUNT(*) as total_exams,
        SUM(CASE WHEN score >= 50 THEN 1 ELSE 0 END) as passed_exams,
        ROUND(AVG(score), 2) as average_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score
      FROM user_exam_mapping
      WHERE user_id = ?
    `;
    const examResult = await db.query(examQuery, [studentId]);
    const examStats = examResult[0][0] || {
      total_exams: 0,
      passed_exams: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
    };

    // Get lesson completion stats
    const lessonQuery = `
      SELECT 
        COUNT(*) as total_lessons,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_lessons
      FROM user_lesson_mapping
      WHERE user_id = ?
    `;
    const lessonResult = await db.query(lessonQuery, [studentId]);
    const lessonStats = lessonResult[0][0] || {
      total_lessons: 0,
      completed_lessons: 0,
    };

    // Get vocabulary learning stats
    const vocabQuery = `
      SELECT 
        COUNT(*) as total_vocabularies,
        SUM(CASE WHEN is_learned = 1 THEN 1 ELSE 0 END) as learned_vocabularies
      FROM user_vocabulary_mapping
      WHERE user_id = ?
    `;
    const vocabResult = await db.query(vocabQuery, [studentId]);
    const vocabStats = vocabResult[0][0] || {
      total_vocabularies: 0,
      learned_vocabularies: 0,
    };

    // Calculate completion rates
    const examCompletionRate = examStats.total_exams > 0 
      ? Math.round((examStats.passed_exams / examStats.total_exams) * 100) 
      : 0;

    const lessonCompletionRate = lessonStats.total_lessons > 0
      ? Math.round((lessonStats.completed_lessons / lessonStats.total_lessons) * 100)
      : 0;

    const vocabCompletionRate = vocabStats.total_vocabularies > 0
      ? Math.round((vocabStats.learned_vocabularies / vocabStats.total_vocabularies) * 100)
      : 0;

    // Overall progress calculation
    const totalItems = examStats.total_exams + lessonStats.total_lessons + vocabStats.total_vocabularies;
    const completedItems = examStats.passed_exams + lessonStats.completed_lessons + vocabStats.learned_vocabularies;
    const overallProgress = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

    return {
      student: {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
      },
      exam_progress: {
        total_exams: parseInt(examStats.total_exams),
        passed_exams: parseInt(examStats.passed_exams),
        failed_exams: parseInt(examStats.total_exams) - parseInt(examStats.passed_exams),
        average_score: parseFloat(examStats.average_score) || 0,
        highest_score: parseInt(examStats.highest_score) || 0,
        lowest_score: parseInt(examStats.lowest_score) || 0,
        pass_rate: examCompletionRate,
      },
      lesson_progress: {
        total_lessons: parseInt(lessonStats.total_lessons),
        completed_lessons: parseInt(lessonStats.completed_lessons),
        remaining_lessons: parseInt(lessonStats.total_lessons) - parseInt(lessonStats.completed_lessons),
        completion_rate: lessonCompletionRate,
      },
      vocabulary_progress: {
        total_vocabularies: parseInt(vocabStats.total_vocabularies),
        learned_vocabularies: parseInt(vocabStats.learned_vocabularies),
        remaining_vocabularies: parseInt(vocabStats.total_vocabularies) - parseInt(vocabStats.learned_vocabularies),
        learning_rate: vocabCompletionRate,
      },
      overall_progress: overallProgress,
      last_updated: new Date(),
    };
  } catch (error) {
    throw error;
  }
};

// Get specific student's progress (for teacher/admin view)
const getStudentProgressById = async (studentId) => {
  return getStudentProgress(studentId);
};

// Get detailed exam history
const getStudentExamHistory = async (studentId, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT 
        uem.exam_attempt_id,
        uem.exam_id,
        e.name as exam_name,
        e.exam_type,
        e.total_points,
        e.passing_score,
        uem.score,
        uem.time_spent_minutes,
        uem.created_at
      FROM user_exam_mapping uem
      LEFT JOIN exam e ON uem.exam_id = e.id
      WHERE uem.user_id = ?
      ORDER BY uem.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await db.query(query, [studentId, limit, offset]);
    return result[0] || [];
  } catch (error) {
    throw error;
  }
};

// Get detailed lesson progress
const getStudentLessonProgress = async (studentId, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT 
        ulm.user_lesson_id,
        ulm.lesson_id,
        l.name as lesson_name,
        l.description,
        ulm.is_completed,
        ulm.completed_at,
        ulm.created_at,
        ulm.updated_at
      FROM user_lesson_mapping ulm
      LEFT JOIN lesson l ON ulm.lesson_id = l.id
      WHERE ulm.user_id = ?
      ORDER BY ulm.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await db.query(query, [studentId, limit, offset]);
    return result[0] || [];
  } catch (error) {
    throw error;
  }
};

// Get detailed vocabulary progress
const getStudentVocabularyProgress = async (studentId, limit = 10, offset = 0) => {
  try {
    const query = `
      SELECT 
        uvm.user_vocabulary_id,
        uvm.vocabulary_id,
        v.word as vocabulary_word,
        v.meaning,
        v.example,
        uvm.is_learned,
        uvm.learned_at,
        uvm.created_at,
        uvm.updated_at
      FROM user_vocabulary_mapping uvm
      LEFT JOIN vocabulary v ON uvm.vocabulary_id = v.id
      WHERE uvm.user_id = ?
      ORDER BY uvm.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await db.query(query, [studentId, limit, offset]);
    return result[0] || [];
  } catch (error) {
    throw error;
  }
};

// Get progress by classroom
const getProgressByClassroom = async (studentId, classroomId) => {
  try {
    // Get exam progress in classroom
    const examQuery = `
      SELECT 
        COUNT(*) as total_exams,
        SUM(CASE WHEN uem.score >= e.passing_score THEN 1 ELSE 0 END) as passed_exams,
        ROUND(AVG(uem.score), 2) as average_score
      FROM user_exam_mapping uem
      LEFT JOIN exam e ON uem.exam_id = e.id
      WHERE uem.user_id = ? AND e.class_room_id = ?
    `;
    const examResult = await db.query(examQuery, [studentId, classroomId]);
    const examStats = examResult[0][0] || {
      total_exams: 0,
      passed_exams: 0,
      average_score: 0,
    };

    // Get lesson progress in classroom
    const lessonQuery = `
      SELECT 
        COUNT(*) as total_lessons,
        SUM(CASE WHEN ulm.is_completed = 1 THEN 1 ELSE 0 END) as completed_lessons
      FROM user_lesson_mapping ulm
      LEFT JOIN lesson l ON ulm.lesson_id = l.id
      WHERE ulm.user_id = ? AND l.class_room_id = ?
    `;
    const lessonResult = await db.query(lessonQuery, [studentId, classroomId]);
    const lessonStats = lessonResult[0][0] || {
      total_lessons: 0,
      completed_lessons: 0,
    };

    return {
      classroom_id: classroomId,
      exam_stats: {
        total_exams: parseInt(examStats.total_exams),
        passed_exams: parseInt(examStats.passed_exams),
        average_score: parseFloat(examStats.average_score) || 0,
      },
      lesson_stats: {
        total_lessons: parseInt(lessonStats.total_lessons),
        completed_lessons: parseInt(lessonStats.completed_lessons),
      },
    };
  } catch (error) {
    throw error;
  }
};

// Get progress statistics by date range
const getProgressByDateRange = async (studentId, startDate, endDate) => {
  try {
    const query = `
      SELECT 
        DATE(uem.created_at) as activity_date,
        COUNT(*) as total_activities,
        SUM(CASE WHEN uem.score >= 50 THEN 1 ELSE 0 END) as completed_activities,
        ROUND(AVG(uem.score), 2) as average_score
      FROM user_exam_mapping uem
      WHERE uem.user_id = ? AND DATE(uem.created_at) BETWEEN ? AND ?
      GROUP BY DATE(uem.created_at)
      ORDER BY activity_date DESC
    `;

    const result = await db.query(query, [studentId, startDate, endDate]);
    return result[0] || [];
  } catch (error) {
    throw error;
  }
};

// Get progress summary for all students in classroom (for teacher/admin)
const getClassroomProgressSummary = async (classroomId, limit = 50, offset = 0) => {
  try {
    const query = `
      SELECT 
        u.id as student_id,
        u.full_name,
        u.email,
        COUNT(DISTINCT uem.exam_id) as total_exams,
        SUM(CASE WHEN uem.score >= 50 THEN 1 ELSE 0 END) as passed_exams,
        ROUND(AVG(uem.score), 2) as average_exam_score,
        COUNT(DISTINCT CASE WHEN ulm.is_completed = 1 THEN ulm.lesson_id END) as completed_lessons,
        COUNT(DISTINCT CASE WHEN uvm.is_learned = 1 THEN uvm.vocabulary_id END) as learned_vocabularies
      FROM user u
      LEFT JOIN user_exam_mapping uem ON u.id = uem.user_id
      LEFT JOIN user_lesson_mapping ulm ON u.id = ulm.user_id
      LEFT JOIN user_vocabulary_mapping uvm ON u.id = uvm.user_id
      LEFT JOIN user_classroom_mapping ucm ON u.id = ucm.user_id
      WHERE ucm.classroom_id = ? AND u.role = 'STUDENT'
      GROUP BY u.id, u.full_name, u.email
      ORDER BY average_exam_score DESC
      LIMIT ? OFFSET ?
    `;

    const result = await db.query(query, [classroomId, limit, offset]);
    return result[0] || [];
  } catch (error) {
    throw error;
  }
};

// Get progress comparison (student vs classroom average)
const getProgressComparison = async (studentId, classroomId) => {
  try {
    // Student's stats
    const studentStats = await getProgressByClassroom(studentId, classroomId);

    // Classroom average
    const classroomQuery = `
      SELECT 
        ROUND(AVG(uem.score), 2) as avg_classroom_exam_score,
        ROUND(AVG(
          CASE WHEN ulm.is_completed = 1 THEN 1 ELSE 0 END
        ) * 100, 2) as avg_classroom_lesson_rate
      FROM user u
      LEFT JOIN user_exam_mapping uem ON u.id = uem.user_id
      LEFT JOIN user_lesson_mapping ulm ON u.id = ulm.user_id
      LEFT JOIN user_classroom_mapping ucm ON u.id = ucm.user_id
      WHERE ucm.classroom_id = ? AND u.role = 'STUDENT'
    `;

    const classroomResult = await db.query(classroomQuery, [classroomId]);
    const classroomStats = classroomResult[0][0] || {
      avg_classroom_exam_score: 0,
      avg_classroom_lesson_rate: 0,
    };

    return {
      student_performance: studentStats,
      classroom_average: {
        average_exam_score: parseFloat(classroomStats.avg_classroom_exam_score) || 0,
        average_lesson_rate: parseFloat(classroomStats.avg_classroom_lesson_rate) || 0,
      },
      comparison: {
        exam_score_difference: 
          (parseFloat(studentStats.exam_stats.average_score) - parseFloat(classroomStats.avg_classroom_exam_score)).toFixed(2),
      },
    };
  } catch (error) {
    throw error;
  }
};

// Get learning trends (progress over weeks)
const getLearningTrends = async (studentId, weeks = 8) => {
  try {
    const query = `
      SELECT 
        WEEK(uem.created_at) as week_number,
        YEAR(uem.created_at) as year,
        COUNT(*) as exams_taken,
        ROUND(AVG(uem.score), 2) as average_score,
        SUM(CASE WHEN uem.score >= 50 THEN 1 ELSE 0 END) as passed_exams
      FROM user_exam_mapping uem
      WHERE uem.user_id = ? 
        AND uem.created_at >= DATE_SUB(NOW(), INTERVAL ? WEEK)
      GROUP BY WEEK(uem.created_at), YEAR(uem.created_at)
      ORDER BY year DESC, week_number DESC
    `;

    const result = await db.query(query, [studentId, weeks]);
    return result[0] || [];
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getStudentProgress,
  getStudentProgressById,
  getStudentExamHistory,
  getStudentLessonProgress,
  getStudentVocabularyProgress,
  getProgressByClassroom,
  getProgressByDateRange,
  getClassroomProgressSummary,
  getProgressComparison,
  getLearningTrends,
};
