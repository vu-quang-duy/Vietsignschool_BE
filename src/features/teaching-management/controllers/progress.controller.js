const progressService = require("../services/progress.services");

// Get student's own progress
const getMyProgress = async (req, res) => {
  try {
    const studentId = req.user.id;

    const progress = await progressService.getStudentProgress(studentId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
        message: "Không tìm thấy học sinh",
      });
    }

    return res.status(200).json({
      success: true,
      data: progress,
      message: "Lấy tiến độ học tập thành công",
    });
  } catch (error) {
    console.error("Error getting student progress:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy tiến độ học tập",
    });
  }
};

// Get specific student's progress (teacher/admin view)
const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Missing student ID",
        message: "Thiếu ID học sinh",
      });
    }

    const progress = await progressService.getStudentProgressById(studentId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
        message: "Không tìm thấy học sinh",
      });
    }

    return res.status(200).json({
      success: true,
      data: progress,
      message: "Lấy tiến độ học tập của học sinh thành công",
    });
  } catch (error) {
    console.error("Error getting student progress:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy tiến độ học tập",
    });
  }
};

// Get student's exam history
const getExamHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Missing student ID",
        message: "Thiếu ID học sinh",
      });
    }

    const history = await progressService.getStudentExamHistory(
      studentId,
      parseInt(limit),
      parseInt(offset)
    );

    return res.status(200).json({
      success: true,
      data: {
        student_id: studentId,
        exam_history: history,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
      message: "Lấy lịch sử bài kiểm tra thành công",
    });
  } catch (error) {
    console.error("Error getting exam history:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy lịch sử bài kiểm tra",
    });
  }
};

// Get student's lesson progress
const getLessonProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Missing student ID",
        message: "Thiếu ID học sinh",
      });
    }

    const progress = await progressService.getStudentLessonProgress(
      studentId,
      parseInt(limit),
      parseInt(offset)
    );

    return res.status(200).json({
      success: true,
      data: {
        student_id: studentId,
        lesson_progress: progress,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
      message: "Lấy tiến độ bài học thành công",
    });
  } catch (error) {
    console.error("Error getting lesson progress:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy tiến độ bài học",
    });
  }
};

// Get student's vocabulary progress
const getVocabularyProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Missing student ID",
        message: "Thiếu ID học sinh",
      });
    }

    const progress = await progressService.getStudentVocabularyProgress(
      studentId,
      parseInt(limit),
      parseInt(offset)
    );

    return res.status(200).json({
      success: true,
      data: {
        student_id: studentId,
        vocabulary_progress: progress,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
      message: "Lấy tiến độ từ vựng thành công",
    });
  } catch (error) {
    console.error("Error getting vocabulary progress:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy tiến độ từ vựng",
    });
  }
};

// Get classroom progress summary
const getClassroomProgressSummary = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!classroomId) {
      return res.status(400).json({
        success: false,
        error: "Missing classroom ID",
        message: "Thiếu ID lớp học",
      });
    }

    const summary = await progressService.getClassroomProgressSummary(
      classroomId,
      parseInt(limit),
      parseInt(offset)
    );

    return res.status(200).json({
      success: true,
      data: {
        classroom_id: classroomId,
        students_progress: summary,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
      message: "Lấy tóm tắt tiến độ lớp học thành công",
    });
  } catch (error) {
    console.error("Error getting classroom progress summary:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy tóm tắt tiến độ lớp học",
    });
  }
};

// Get progress by classroom
const getProgressByClassroom = async (req, res) => {
  try {
    const { studentId, classroomId } = req.params;

    if (!studentId || !classroomId) {
      return res.status(400).json({
        success: false,
        error: "Missing student ID or classroom ID",
        message: "Thiếu ID học sinh hoặc ID lớp học",
      });
    }

    const progress = await progressService.getProgressByClassroom(
      studentId,
      classroomId
    );

    return res.status(200).json({
      success: true,
      data: progress,
      message: "Lấy tiến độ theo lớp học thành công",
    });
  } catch (error) {
    console.error("Error getting progress by classroom:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy tiến độ theo lớp học",
    });
  }
};

// Get progress by date range
const getProgressByDateRange = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { start_date, end_date } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Missing student ID",
        message: "Thiếu ID học sinh",
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: "Missing date range",
        message: "Thiếu khoảng thời gian",
      });
    }

    const progress = await progressService.getProgressByDateRange(
      studentId,
      start_date,
      end_date
    );

    return res.status(200).json({
      success: true,
      data: {
        student_id: studentId,
        date_range: {
          start_date,
          end_date,
        },
        daily_progress: progress,
      },
      message: "Lấy tiến độ theo khoảng thời gian thành công",
    });
  } catch (error) {
    console.error("Error getting progress by date range:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy tiến độ theo khoảng thời gian",
    });
  }
};

// Get progress comparison
const getProgressComparison = async (req, res) => {
  try {
    const { studentId, classroomId } = req.params;

    if (!studentId || !classroomId) {
      return res.status(400).json({
        success: false,
        error: "Missing student ID or classroom ID",
        message: "Thiếu ID học sinh hoặc ID lớp học",
      });
    }

    const comparison = await progressService.getProgressComparison(
      studentId,
      classroomId
    );

    return res.status(200).json({
      success: true,
      data: comparison,
      message: "Lấy so sánh tiến độ thành công",
    });
  } catch (error) {
    console.error("Error getting progress comparison:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy so sánh tiến độ",
    });
  }
};

// Get learning trends
const getLearningTrends = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { weeks = 8 } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Missing student ID",
        message: "Thiếu ID học sinh",
      });
    }

    const trends = await progressService.getLearningTrends(
      studentId,
      parseInt(weeks)
    );

    return res.status(200).json({
      success: true,
      data: {
        student_id: studentId,
        weeks: parseInt(weeks),
        learning_trends: trends,
      },
      message: "Lấy xu hướng học tập thành công",
    });
  } catch (error) {
    console.error("Error getting learning trends:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Lỗi khi lấy xu hướng học tập",
    });
  }
};

module.exports = {
  getMyProgress,
  getStudentProgress,
  getExamHistory,
  getLessonProgress,
  getVocabularyProgress,
  getClassroomProgressSummary,
  getProgressByClassroom,
  getProgressByDateRange,
  getProgressComparison,
  getLearningTrends,
};
