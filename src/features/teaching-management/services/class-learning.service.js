/**
 * Class Learning Service
 * Chức năng học tập theo lớp cho học sinh
 * Sử dụng schema: class_room, class_student (user_id), class_teacher (user_id), part (thay vì lesson_part)
 */

const db = require('../../../db');
const { ClassStudentStatus, generateClassCode } = require('../constants/class.constants');

// =====================================================
// STUDENT: Tham gia / Rời lớp
// =====================================================

/**
 * Học sinh tham gia lớp bằng mã lớp
 */
async function joinClassByCode(userId, classCode) {
  if (!userId || !classCode) {
    const err = new Error('userId và classCode là bắt buộc');
    err.status = 400;
    throw err;
  }

  // Tìm lớp theo mã
  const [classrooms] = await db.query(
    `SELECT class_room_id, content, class_level, is_active
     FROM class_room
     WHERE class_code = ? AND is_active = 1
     LIMIT 1`,
    [classCode.toUpperCase()]
  );

  if (classrooms.length === 0) {
    const err = new Error('Mã lớp không hợp lệ hoặc lớp không tồn tại');
    err.status = 404;
    throw err;
  }

  const classroom = classrooms[0];

  // Kiểm tra đã tham gia chưa
  const [existing] = await db.query(
    `SELECT class_student_id, status
     FROM class_student
     WHERE class_room_id = ? AND user_id = ?
     LIMIT 1`,
    [classroom.class_room_id, userId]
  );

  if (existing.length > 0) {
    if (!existing[0].status || existing[0].status === 'ACTIVE') {
      const err = new Error('Bạn đã tham gia lớp này rồi');
      err.status = 400;
      throw err;
    }
    // Nếu đã rời lớp, cho phép tham gia lại
    await db.query(
      `UPDATE class_student SET status = 'ACTIVE', modified_date = NOW()
       WHERE class_student_id = ?`,
      [existing[0].class_student_id]
    );
  } else {
    // Tạo mới
    await db.query(
      `INSERT INTO class_student (class_room_id, user_id, status, created_date)
       VALUES (?, ?, 'ACTIVE', NOW())`,
      [classroom.class_room_id, userId]
    );
  }

  // Tạo bản ghi tiến độ học tập
  await initLearningProgress(userId, classroom.class_room_id);

  return {
    message: 'Tham gia lớp thành công',
    classroom: {
      classRoomId: classroom.class_room_id,
      name: classroom.content,
      classLevel: classroom.class_level,
    }
  };
}

/**
 * Học sinh rời lớp
 */
async function leaveClass(userId, classRoomId) {
  if (!userId || !classRoomId) {
    const err = new Error('userId và classRoomId là bắt buộc');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    `UPDATE class_student
     SET status = 'LEFT', modified_date = NOW()
     WHERE user_id = ? AND class_room_id = ? AND (status = 'ACTIVE' OR status IS NULL)`,
    [userId, classRoomId]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Bạn không phải là thành viên của lớp này');
    err.status = 404;
    throw err;
  }

  return { message: 'Đã rời khỏi lớp học' };
}

/**
 * Lấy danh sách lớp của học sinh
 */
async function getMyClasses(userId, { page = 1, limit = 20 } = {}) {
  const offset = (Number(page) - 1) * Number(limit);

  const [rows] = await db.query(
    `SELECT
      c.class_room_id,
      c.content AS name,
      c.description,
      c.class_level,
      c.class_code,
      c.thumbnail_path,
      c.image_location,
      cs.created_date AS joined_at,
      cs.status AS enrollment_status,
      (SELECT COUNT(*) FROM class_student WHERE class_room_id = c.class_room_id AND (status = 'ACTIVE' OR status IS NULL)) AS student_count,
      (SELECT COUNT(*) FROM lesson WHERE class_room_id = c.class_room_id) AS lesson_count,
      COALESCE(clp.completed_lessons, 0) AS completed_lessons,
      COALESCE(clp.learned_vocabularies, 0) AS learned_vocabularies,
      clp.last_activity_at
    FROM class_student cs
    JOIN class_room c ON cs.class_room_id = c.class_room_id
    LEFT JOIN class_learning_progress clp ON cs.user_id = clp.user_id AND cs.class_room_id = clp.class_room_id
    WHERE cs.user_id = ? AND (cs.status = 'ACTIVE' OR cs.status IS NULL) AND c.is_active = 1
    ORDER BY cs.created_date DESC
    LIMIT ? OFFSET ?`,
    [userId, Number(limit), Number(offset)]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM class_student cs
     JOIN class_room c ON cs.class_room_id = c.class_room_id
     WHERE cs.user_id = ? AND (cs.status = 'ACTIVE' OR cs.status IS NULL) AND c.is_active = 1`,
    [userId]
  );

  return {
    classes: rows,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(Number(total) / Number(limit))
    }
  };
}

// =====================================================
// LEARNING: Nội dung học tập theo lớp
// =====================================================

/**
 * Lấy danh sách bài học theo lớp
 * Sử dụng part_view để tính tiến độ (không có lesson_view trong schema)
 */
async function getLessonsByClass(classRoomId, userId) {
  // Kiểm tra học sinh có trong lớp không
  await verifyStudentInClass(userId, classRoomId);

  const [lessons] = await db.query(
    `SELECT
      l.lesson_id,
      l.lesson_name,
      l.description,
      l.image_location,
      l.video_location,
      l.order_index,
      (SELECT COUNT(*) FROM part WHERE lesson_id = l.lesson_id) AS total_parts,
      (SELECT COUNT(*) FROM part_view pv
       JOIN part p ON pv.part_id = p.part_id
       WHERE p.lesson_id = l.lesson_id AND pv.user_id = ?) AS viewed_parts,
      (SELECT COUNT(*) FROM part_view pv
       JOIN part p ON pv.part_id = p.part_id
       WHERE p.lesson_id = l.lesson_id AND pv.user_id = ? AND pv.completed = 1) AS completed_parts,
      (SELECT MAX(pv.last_viewed_at) FROM part_view pv
       JOIN part p ON pv.part_id = p.part_id
       WHERE p.lesson_id = l.lesson_id AND pv.user_id = ?) AS last_viewed_at
    FROM lesson l
    WHERE l.class_room_id = ?
    ORDER BY l.order_index ASC, l.lesson_id ASC`,
    [userId, userId, userId, classRoomId]
  );

  // Tính progress_percent dựa trên số parts hoàn thành
  const lessonsWithProgress = lessons.map(lesson => ({
    ...lesson,
    view_count: lesson.viewed_parts,
    completed: lesson.total_parts > 0 && lesson.completed_parts >= lesson.total_parts ? 1 : 0,
    progress_percent: lesson.total_parts > 0
      ? Math.round((lesson.completed_parts / lesson.total_parts) * 100)
      : 0
  }));

  return { lessons: lessonsWithProgress };
}

/**
 * Lấy chi tiết bài học
 */
async function getLessonDetail(lessonId, userId) {
  const [lessons] = await db.query(
    `SELECT
      l.lesson_id,
      l.lesson_name,
      l.description,
      l.class_room_id,
      l.image_location,
      l.video_location,
      l.order_index,
      c.content AS class_room_name,
      c.class_level
    FROM lesson l
    JOIN class_room c ON l.class_room_id = c.class_room_id
    WHERE l.lesson_id = ?`,
    [lessonId]
  );

  if (lessons.length === 0) {
    const err = new Error('Bài học không tồn tại');
    err.status = 404;
    throw err;
  }

  const lesson = lessons[0];

  // Kiểm tra học sinh có trong lớp không
  await verifyStudentInClass(userId, lesson.class_room_id);

  // Lấy các phần trong bài học (bảng part, không phải lesson_part)
  // part_image và part_video là bảng riêng
  const [parts] = await db.query(
    `SELECT
      p.part_id,
      p.part_name,
      p.description,
      p.order_index,
      (SELECT GROUP_CONCAT(pi.image_location) FROM part_image pi WHERE pi.part_id = p.part_id) AS images,
      (SELECT GROUP_CONCAT(pv.video_location) FROM part_video pv WHERE pv.part_id = p.part_id) AS videos
     FROM part p
     WHERE p.lesson_id = ?
     ORDER BY p.order_index ASC`,
    [lessonId]
  );

  // Lấy từ vựng trong bài học
  const [vocabularies] = await db.query(
    `SELECT
      vocabulary_id, content, description, vocabulary_type,
      images_path, videos_path, note
    FROM vocabulary
    WHERE lesson_id = ? AND status = 'APPROVED'
    ORDER BY vocabulary_id`,
    [lessonId]
  );

  // Ghi nhận xem các part trong bài học (sử dụng part_view)
  for (const part of parts) {
    await recordPartView(userId, part.part_id, lessonId);
  }

  return {
    lesson: {
      ...lesson,
      parts,
      vocabularies
    }
  };
}

/**
 * Lấy danh sách chủ đề theo lớp
 * Topic sử dụng content thay vì name, is_private thay vì is_common
 */
async function getTopicsByClass(classRoomId, userId) {
  await verifyStudentInClass(userId, classRoomId);

  const [topics] = await db.query(
    `SELECT
      t.topic_id,
      t.content AS name,
      t.description,
      t.image_location,
      t.video_location,
      t.is_private,
      (SELECT COUNT(*) FROM vocabulary WHERE topic_id = t.topic_id AND status = 'APPROVED') AS vocabulary_count
    FROM topic t
    WHERE (t.class_room_id = ? OR t.is_private = 0) AND (t.is_active = 1 OR t.is_active IS NULL)
    ORDER BY t.content`,
    [classRoomId]
  );

  return { topics };
}

/**
 * Lấy từ vựng theo chủ đề
 */
async function getVocabulariesByTopic(topicId, userId, { page = 1, limit = 20 } = {}) {
  const offset = (Number(page) - 1) * Number(limit);

  // Lấy thông tin topic
  const [topics] = await db.query(
    `SELECT topic_id, content AS name, class_room_id, is_private FROM topic WHERE topic_id = ?`,
    [topicId]
  );

  if (topics.length === 0) {
    const err = new Error('Chủ đề không tồn tại');
    err.status = 404;
    throw err;
  }

  const topic = topics[0];

  // Nếu topic thuộc lớp cụ thể và là private, kiểm tra quyền
  if (topic.class_room_id && topic.is_private) {
    await verifyStudentInClass(userId, topic.class_room_id);
  }

  const [vocabularies] = await db.query(
    `SELECT
      v.vocabulary_id,
      v.content,
      v.description,
      v.vocabulary_type,
      v.images_path,
      v.videos_path,
      v.note,
      COALESCE(vv.view_count, 0) AS view_count,
      vv.last_viewed_at
    FROM vocabulary v
    LEFT JOIN vocabulary_view vv ON v.vocabulary_id = vv.vocabulary_id AND vv.user_id = ?
    WHERE v.topic_id = ? AND v.status = 'APPROVED'
    ORDER BY v.content
    LIMIT ? OFFSET ?`,
    [userId, topicId, Number(limit), Number(offset)]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM vocabulary WHERE topic_id = ? AND status = 'APPROVED'`,
    [topicId]
  );

  return {
    topic: { topicId: topic.topic_id, name: topic.name },
    vocabularies,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total)
    }
  };
}

/**
 * Xem chi tiết từ vựng
 */
async function getVocabularyDetail(vocabularyId, userId) {
  const [vocabs] = await db.query(
    `SELECT
      v.*,
      t.content AS topic_name,
      c.content AS class_room_name
    FROM vocabulary v
    LEFT JOIN topic t ON v.topic_id = t.topic_id
    LEFT JOIN class_room c ON v.class_room_id = c.class_room_id
    WHERE v.vocabulary_id = ? AND v.status = 'APPROVED'`,
    [vocabularyId]
  );

  if (vocabs.length === 0) {
    const err = new Error('Từ vựng không tồn tại');
    err.status = 404;
    throw err;
  }

  // Ghi nhận xem từ vựng
  await recordVocabularyView(userId, vocabularyId);

  return { vocabulary: vocabs[0] };
}

// =====================================================
// PROGRESS: Tiến độ học tập
// =====================================================

/**
 * Lấy tiến độ học tập theo lớp
 * Sử dụng part_view thay vì lesson_view (theo schema vietsignschool.sql)
 */
async function getClassProgress(userId, classRoomId) {
  await verifyStudentInClass(userId, classRoomId);

  // Thống kê bài học (tính lesson completed dựa trên parts completed)
  const [[lessonStats]] = await db.query(
    `SELECT
      COUNT(*) AS total_lessons,
      (SELECT COUNT(DISTINCT l2.lesson_id) FROM lesson l2
       WHERE l2.class_room_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM part p WHERE p.lesson_id = l2.lesson_id
         AND NOT EXISTS (
           SELECT 1 FROM part_view pv WHERE pv.part_id = p.part_id AND pv.user_id = ? AND pv.completed = 1
         )
       )
       AND EXISTS (SELECT 1 FROM part p2 WHERE p2.lesson_id = l2.lesson_id)
      ) AS completed_lessons
    FROM lesson WHERE class_room_id = ?`,
    [classRoomId, userId, classRoomId]
  );

  // Thống kê parts
  const [[partStats]] = await db.query(
    `SELECT
      COUNT(*) AS total_parts,
      (SELECT COUNT(*) FROM part_view pv
       JOIN part p ON pv.part_id = p.part_id
       JOIN lesson l ON p.lesson_id = l.lesson_id
       WHERE pv.user_id = ? AND l.class_room_id = ? AND pv.completed = 1) AS completed_parts
    FROM part p
    JOIN lesson l ON p.lesson_id = l.lesson_id
    WHERE l.class_room_id = ?`,
    [userId, classRoomId, classRoomId]
  );

  // Thống kê từ vựng
  const [[vocabStats]] = await db.query(
    `SELECT
      COUNT(*) AS total_vocabularies,
      (SELECT COUNT(DISTINCT vv.vocabulary_id) FROM vocabulary_view vv
       JOIN vocabulary v ON vv.vocabulary_id = v.vocabulary_id
       WHERE vv.user_id = ? AND v.class_room_id = ?) AS learned_vocabularies
    FROM vocabulary WHERE class_room_id = ? AND status = 'APPROVED'`,
    [userId, classRoomId, classRoomId]
  );

  // Bài học gần đây (dựa trên part_view)
  const [recentLessons] = await db.query(
    `SELECT
      l.lesson_id,
      l.lesson_name,
      (SELECT COUNT(*) FROM part WHERE lesson_id = l.lesson_id) AS total_parts,
      (SELECT COUNT(*) FROM part_view pv JOIN part p ON pv.part_id = p.part_id
       WHERE p.lesson_id = l.lesson_id AND pv.user_id = ? AND pv.completed = 1) AS completed_parts,
      (SELECT MAX(pv.last_viewed_at) FROM part_view pv JOIN part p ON pv.part_id = p.part_id
       WHERE p.lesson_id = l.lesson_id AND pv.user_id = ?) AS last_viewed_at
    FROM lesson l
    WHERE l.class_room_id = ?
    AND EXISTS (SELECT 1 FROM part_view pv JOIN part p ON pv.part_id = p.part_id WHERE p.lesson_id = l.lesson_id AND pv.user_id = ?)
    ORDER BY last_viewed_at DESC
    LIMIT 5`,
    [userId, userId, classRoomId, userId]
  );

  // Tính progress_percent cho mỗi bài học
  const recentLessonsWithProgress = recentLessons.map(lesson => ({
    lesson_id: lesson.lesson_id,
    lesson_name: lesson.lesson_name,
    progress_percent: lesson.total_parts > 0
      ? Math.round((lesson.completed_parts / lesson.total_parts) * 100)
      : 0,
    last_viewed_at: lesson.last_viewed_at
  }));

  // Từ vựng gần đây
  const [recentVocabs] = await db.query(
    `SELECT
      v.vocabulary_id, v.content, vv.view_count, vv.last_viewed_at
    FROM vocabulary_view vv
    JOIN vocabulary v ON vv.vocabulary_id = v.vocabulary_id
    WHERE vv.user_id = ? AND v.class_room_id = ?
    ORDER BY vv.last_viewed_at DESC
    LIMIT 5`,
    [userId, classRoomId]
  );

  // Cập nhật bảng tiến độ
  await updateLearningProgress(userId, classRoomId, {
    totalLessons: lessonStats.total_lessons,
    completedLessons: lessonStats.completed_lessons,
    totalParts: partStats.total_parts,
    completedParts: partStats.completed_parts,
    totalVocabularies: vocabStats.total_vocabularies,
    learnedVocabularies: vocabStats.learned_vocabularies,
  });

  return {
    progress: {
      lessons: {
        total: lessonStats.total_lessons || 0,
        completed: lessonStats.completed_lessons || 0,
        percent: lessonStats.total_lessons > 0
          ? Math.round((lessonStats.completed_lessons / lessonStats.total_lessons) * 100)
          : 0
      },
      parts: {
        total: partStats.total_parts || 0,
        completed: partStats.completed_parts || 0,
        percent: partStats.total_parts > 0
          ? Math.round((partStats.completed_parts / partStats.total_parts) * 100)
          : 0
      },
      vocabularies: {
        total: vocabStats.total_vocabularies || 0,
        learned: vocabStats.learned_vocabularies || 0,
        percent: vocabStats.total_vocabularies > 0
          ? Math.round((vocabStats.learned_vocabularies / vocabStats.total_vocabularies) * 100)
          : 0
      }
    },
    recentLessons: recentLessonsWithProgress,
    recentVocabularies: recentVocabs
  };
}

/**
 * Đánh dấu hoàn thành bài học
 * Đánh dấu tất cả parts trong lesson là completed
 */
async function markLessonComplete(userId, lessonId) {
  const [lessons] = await db.query(
    `SELECT class_room_id FROM lesson WHERE lesson_id = ?`,
    [lessonId]
  );

  if (lessons.length === 0) {
    const err = new Error('Bài học không tồn tại');
    err.status = 404;
    throw err;
  }

  await verifyStudentInClass(userId, lessons[0].class_room_id);

  // Lấy tất cả parts trong lesson
  const [parts] = await db.query(
    `SELECT part_id FROM part WHERE lesson_id = ?`,
    [lessonId]
  );

  // Đánh dấu tất cả parts là completed
  for (const part of parts) {
    await db.query(
      `INSERT INTO part_view (user_id, part_id, lesson_id, view_count, completed, progress_percent, last_viewed_at, created_date)
       VALUES (?, ?, ?, 1, 1, 100, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       completed = 1, progress_percent = 100, last_viewed_at = NOW()`,
      [userId, part.part_id, lessonId]
    );
  }

  return { message: 'Đã đánh dấu hoàn thành bài học' };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Kiểm tra học sinh có trong lớp không
 */
async function verifyStudentInClass(userId, classRoomId) {
  const [rows] = await db.query(
    `SELECT class_student_id FROM class_student
     WHERE user_id = ? AND class_room_id = ? AND (status = 'ACTIVE' OR status IS NULL)`,
    [userId, classRoomId]
  );

  if (rows.length === 0) {
    const err = new Error('Bạn không phải là thành viên của lớp này');
    err.status = 403;
    throw err;
  }

  return true;
}

/**
 * Khởi tạo tiến độ học tập
 */
async function initLearningProgress(userId, classRoomId) {
  // Đếm tổng bài học, parts và từ vựng
  const [[lessonCount]] = await db.query(
    `SELECT COUNT(*) as count FROM lesson WHERE class_room_id = ?`,
    [classRoomId]
  );

  const [[partCount]] = await db.query(
    `SELECT COUNT(*) as count FROM part p
     JOIN lesson l ON p.lesson_id = l.lesson_id
     WHERE l.class_room_id = ?`,
    [classRoomId]
  );

  const [[vocabCount]] = await db.query(
    `SELECT COUNT(*) as count FROM vocabulary WHERE class_room_id = ? AND status = 'APPROVED'`,
    [classRoomId]
  );

  await db.query(
    `INSERT INTO class_learning_progress
     (user_id, class_room_id, total_lessons, total_parts, total_vocabularies, last_activity_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
     total_lessons = VALUES(total_lessons),
     total_parts = VALUES(total_parts),
     total_vocabularies = VALUES(total_vocabularies),
     last_activity_at = NOW()`,
    [userId, classRoomId, lessonCount.count, partCount.count, vocabCount.count]
  );
}

/**
 * Cập nhật tiến độ học tập
 */
async function updateLearningProgress(userId, classRoomId, stats) {
  await db.query(
    `UPDATE class_learning_progress SET
     total_lessons = ?,
     completed_lessons = ?,
     total_parts = ?,
     completed_parts = ?,
     total_vocabularies = ?,
     learned_vocabularies = ?,
     last_activity_at = NOW()
     WHERE user_id = ? AND class_room_id = ?`,
    [
      stats.totalLessons,
      stats.completedLessons,
      stats.totalParts || 0,
      stats.completedParts || 0,
      stats.totalVocabularies,
      stats.learnedVocabularies,
      userId,
      classRoomId
    ]
  );
}

/**
 * Ghi nhận xem part (sử dụng part_view thay vì lesson_view)
 */
async function recordPartView(userId, partId, lessonId) {
  const [existing] = await db.query(
    `SELECT part_view_id FROM part_view WHERE user_id = ? AND part_id = ?`,
    [userId, partId]
  );

  if (existing.length === 0) {
    await db.query(
      `INSERT INTO part_view (user_id, part_id, lesson_id, view_count, last_viewed_at, created_date)
       VALUES (?, ?, ?, 1, NOW(), NOW())`,
      [userId, partId, lessonId]
    );
  } else {
    await db.query(
      `UPDATE part_view SET view_count = view_count + 1, last_viewed_at = NOW()
       WHERE user_id = ? AND part_id = ?`,
      [userId, partId]
    );
  }
}

/**
 * Ghi nhận xem từ vựng
 */
async function recordVocabularyView(userId, vocabularyId) {
  const [existing] = await db.query(
    `SELECT vocabulary_view_id FROM vocabulary_view WHERE user_id = ? AND vocabulary_id = ?`,
    [userId, vocabularyId]
  );

  if (existing.length === 0) {
    await db.query(
      `INSERT INTO vocabulary_view (user_id, vocabulary_id, view_count, last_viewed_at, created_date)
       VALUES (?, ?, 1, NOW(), NOW())`,
      [userId, vocabularyId]
    );
  } else {
    await db.query(
      `UPDATE vocabulary_view SET view_count = view_count + 1, last_viewed_at = NOW()
       WHERE user_id = ? AND vocabulary_id = ?`,
      [userId, vocabularyId]
    );
  }
}

module.exports = {
  // Tham gia / Rời lớp
  joinClassByCode,
  leaveClass,
  getMyClasses,
  // Nội dung học tập
  getLessonsByClass,
  getLessonDetail,
  getTopicsByClass,
  getVocabulariesByTopic,
  getVocabularyDetail,
  // Tiến độ
  getClassProgress,
  markLessonComplete,
  // Helpers
  verifyStudentInClass,
};
