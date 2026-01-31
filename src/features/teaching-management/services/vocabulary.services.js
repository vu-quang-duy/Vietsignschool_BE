/**
 * Vocabulary Service
 * Quản lý từ vựng theo schema vietsignschool.sql
 * Table: vocabulary (vocabulary_id, content, description, topic_id, vocabulary_type,
 *        status, is_private, class_room_id, lesson_id, part_id,
 *        images_path, videos_path, slug, note, created_id)
 * vocabulary_type: WORD, SENTENCE, PARAGRAPH
 * status: PENDING, APPROVED, REJECTED
 */

const db = require('../../../db');

/**
 * Tạo từ vựng mới
 */
async function createVocabulary(data, userId) {
  const {
    content,
    description,
    topicId,
    classRoomId,
    lessonId,
    partId,
    vocabularyType = 'WORD',
    isPrivate = 0,
    imagesPath,
    videosPath,
    slug,
    note,
    status = 'PENDING'
  } = data;

  if (!content) {
    const err = new Error('Nội dung từ vựng là bắt buộc');
    err.status = 400;
    throw err;
  }

  // Generate slug if not provided
  const finalSlug = slug || generateSlug(content);

  const [result] = await db.query(
    `INSERT INTO vocabulary
     (content, description, topic_id, class_room_id, lesson_id, part_id,
      vocabulary_type, is_private, images_path, videos_path, slug, note, status,
      created_id, created_by, created_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      content,
      description || null,
      topicId || null,
      classRoomId || null,
      lessonId || null,
      partId || null,
      vocabularyType,
      isPrivate ? 1 : 0,
      imagesPath || null,
      videosPath || null,
      finalSlug,
      note || null,
      status,
      userId,
      userId
    ]
  );

  return {
    vocabularyId: result.insertId,
    content,
    description,
    topicId,
    classRoomId,
    lessonId,
    partId,
    vocabularyType,
    isPrivate,
    imagesPath,
    videosPath,
    slug: finalSlug,
    note,
    status,
    createdId: userId,
    createdAt: new Date()
  };
}

/**
 * Generate slug from content
 */
function generateSlug(content) {
  return content
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Lấy danh sách từ vựng
 */
async function getVocabularies(filters = {}) {
  const {
    page = 1,
    limit = 20,
    q,
    topicId,
    classRoomId,
    lessonId,
    partId,
    vocabularyType,
    isPrivate,
    status = 'APPROVED'
  } = filters;

  const offset = (Number(page) - 1) * Number(limit);
  const params = [];

  let sqlQuery = `
    SELECT
      v.vocabulary_id,
      v.content,
      v.description,
      v.vocabulary_type,
      v.status,
      v.is_private,
      v.images_path,
      v.videos_path,
      v.slug,
      v.note,
      v.topic_id,
      v.class_room_id,
      v.lesson_id,
      v.part_id,
      v.created_id,
      v.created_by,
      v.created_date,
      v.modified_by,
      v.modified_date,
      t.content AS topic_name,
      c.content AS class_room_name,
      l.lesson_name,
      p.part_name,
      u.name AS creator_name
    FROM vocabulary v
    LEFT JOIN topic t ON v.topic_id = t.topic_id
    LEFT JOIN class_room c ON v.class_room_id = c.class_room_id
    LEFT JOIN lesson l ON v.lesson_id = l.lesson_id
    LEFT JOIN part p ON v.part_id = p.part_id
    LEFT JOIN user u ON v.created_id = u.user_id
    WHERE 1=1
  `;

  if (q) {
    sqlQuery += ' AND (v.content LIKE ? OR v.description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  if (topicId) {
    sqlQuery += ' AND v.topic_id = ?';
    params.push(topicId);
  }

  if (classRoomId) {
    sqlQuery += ' AND v.class_room_id = ?';
    params.push(classRoomId);
  }

  if (lessonId) {
    sqlQuery += ' AND v.lesson_id = ?';
    params.push(lessonId);
  }

  if (partId) {
    sqlQuery += ' AND v.part_id = ?';
    params.push(partId);
  }

  if (vocabularyType) {
    sqlQuery += ' AND v.vocabulary_type = ?';
    params.push(vocabularyType);
  }

  if (isPrivate !== undefined && isPrivate !== null) {
    sqlQuery += ' AND v.is_private = ?';
    params.push(isPrivate ? 1 : 0);
  }

  if (status) {
    sqlQuery += ' AND v.status = ?';
    params.push(status);
  }

  sqlQuery += ' ORDER BY v.created_date DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await db.query(sqlQuery, params);

  // Count total
  let countQuery = 'SELECT COUNT(*) as total FROM vocabulary v WHERE 1=1';
  const countParams = [];

  if (q) {
    countQuery += ' AND (v.content LIKE ? OR v.description LIKE ?)';
    countParams.push(`%${q}%`, `%${q}%`);
  }
  if (topicId) {
    countQuery += ' AND v.topic_id = ?';
    countParams.push(topicId);
  }
  if (classRoomId) {
    countQuery += ' AND v.class_room_id = ?';
    countParams.push(classRoomId);
  }
  if (lessonId) {
    countQuery += ' AND v.lesson_id = ?';
    countParams.push(lessonId);
  }
  if (partId) {
    countQuery += ' AND v.part_id = ?';
    countParams.push(partId);
  }
  if (vocabularyType) {
    countQuery += ' AND v.vocabulary_type = ?';
    countParams.push(vocabularyType);
  }
  if (isPrivate !== undefined && isPrivate !== null) {
    countQuery += ' AND v.is_private = ?';
    countParams.push(isPrivate ? 1 : 0);
  }
  if (status) {
    countQuery += ' AND v.status = ?';
    countParams.push(status);
  }

  const [[{ total }]] = await db.query(countQuery, countParams);

  return {
    data: rows,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(Number(total) / Number(limit))
    }
  };
}

/**
 * Lấy chi tiết từ vựng
 */
async function getVocabularyById(vocabularyId) {
  if (!vocabularyId) {
    const err = new Error('Vocabulary ID is required');
    err.status = 400;
    throw err;
  }

  const [rows] = await db.query(
    `SELECT
      v.*,
      t.content AS topic_name,
      c.content AS class_room_name,
      l.lesson_name,
      p.part_name,
      u.name AS creator_name
    FROM vocabulary v
    LEFT JOIN topic t ON v.topic_id = t.topic_id
    LEFT JOIN class_room c ON v.class_room_id = c.class_room_id
    LEFT JOIN lesson l ON v.lesson_id = l.lesson_id
    LEFT JOIN part p ON v.part_id = p.part_id
    LEFT JOIN user u ON v.created_id = u.user_id
    WHERE v.vocabulary_id = ?`,
    [vocabularyId]
  );

  if (rows.length === 0) {
    const err = new Error('Từ vựng không tồn tại');
    err.status = 404;
    throw err;
  }

  return rows[0];
}

/**
 * Lấy từ vựng theo slug
 */
async function getVocabularyBySlug(slug) {
  if (!slug) {
    const err = new Error('Slug is required');
    err.status = 400;
    throw err;
  }

  const [rows] = await db.query(
    `SELECT
      v.*,
      t.content AS topic_name,
      c.content AS class_room_name,
      l.lesson_name,
      p.part_name,
      u.name AS creator_name
    FROM vocabulary v
    LEFT JOIN topic t ON v.topic_id = t.topic_id
    LEFT JOIN class_room c ON v.class_room_id = c.class_room_id
    LEFT JOIN lesson l ON v.lesson_id = l.lesson_id
    LEFT JOIN part p ON v.part_id = p.part_id
    LEFT JOIN user u ON v.created_id = u.user_id
    WHERE v.slug = ? AND v.status = 'APPROVED'`,
    [slug]
  );

  if (rows.length === 0) {
    const err = new Error('Từ vựng không tồn tại');
    err.status = 404;
    throw err;
  }

  return rows[0];
}

/**
 * Lấy từ vựng theo topic
 */
async function getVocabulariesByTopicId(topicId, options = {}) {
  if (!topicId) {
    const err = new Error('Topic ID is required');
    err.status = 400;
    throw err;
  }

  const { status = 'APPROVED' } = options;

  const [rows] = await db.query(
    `SELECT
      v.vocabulary_id,
      v.content,
      v.description,
      v.vocabulary_type,
      v.images_path,
      v.videos_path,
      v.slug,
      v.note,
      v.status
    FROM vocabulary v
    WHERE v.topic_id = ? AND v.status = ?
    ORDER BY v.content ASC`,
    [topicId, status]
  );

  return rows;
}

/**
 * Lấy từ vựng theo lớp học
 */
async function getVocabulariesByClassroomId(classRoomId, options = {}) {
  if (!classRoomId) {
    const err = new Error('Class room ID is required');
    err.status = 400;
    throw err;
  }

  const { status = 'APPROVED' } = options;

  const [rows] = await db.query(
    `SELECT
      v.vocabulary_id,
      v.content,
      v.description,
      v.vocabulary_type,
      v.images_path,
      v.videos_path,
      v.slug,
      v.note,
      v.status,
      v.topic_id,
      t.content AS topic_name,
      v.lesson_id,
      l.lesson_name,
      v.part_id,
      p.part_name
    FROM vocabulary v
    LEFT JOIN topic t ON v.topic_id = t.topic_id
    LEFT JOIN lesson l ON v.lesson_id = l.lesson_id
    LEFT JOIN part p ON v.part_id = p.part_id
    WHERE v.class_room_id = ? AND v.status = ?
    ORDER BY v.content ASC`,
    [classRoomId, status]
  );

  return rows;
}

/**
 * Lấy từ vựng theo bài học
 */
async function getVocabulariesByLessonId(lessonId, options = {}) {
  if (!lessonId) {
    const err = new Error('Lesson ID is required');
    err.status = 400;
    throw err;
  }

  const { status = 'APPROVED' } = options;

  const [rows] = await db.query(
    `SELECT
      v.vocabulary_id,
      v.content,
      v.description,
      v.vocabulary_type,
      v.images_path,
      v.videos_path,
      v.slug,
      v.note,
      v.status,
      v.part_id,
      p.part_name
    FROM vocabulary v
    LEFT JOIN part p ON v.part_id = p.part_id
    WHERE v.lesson_id = ? AND v.status = ?
    ORDER BY v.content ASC`,
    [lessonId, status]
  );

  return rows;
}

/**
 * Lấy từ vựng theo loại
 */
async function getVocabulariesByType(vocabularyType, filters = {}) {
  if (!vocabularyType) {
    const err = new Error('Vocabulary type is required');
    err.status = 400;
    throw err;
  }

  const { topicId, classRoomId, lessonId, status = 'APPROVED' } = filters;
  const params = [vocabularyType];

  let query = `
    SELECT
      v.vocabulary_id,
      v.content,
      v.description,
      v.vocabulary_type,
      v.images_path,
      v.videos_path,
      v.slug,
      v.note,
      v.status,
      v.topic_id,
      t.content AS topic_name,
      v.class_room_id,
      c.content AS class_room_name
    FROM vocabulary v
    LEFT JOIN topic t ON v.topic_id = t.topic_id
    LEFT JOIN class_room c ON v.class_room_id = c.class_room_id
    WHERE v.vocabulary_type = ?
  `;

  if (topicId) {
    query += ' AND v.topic_id = ?';
    params.push(topicId);
  }

  if (classRoomId) {
    query += ' AND v.class_room_id = ?';
    params.push(classRoomId);
  }

  if (lessonId) {
    query += ' AND v.lesson_id = ?';
    params.push(lessonId);
  }

  if (status) {
    query += ' AND v.status = ?';
    params.push(status);
  }

  query += ' ORDER BY v.content ASC';

  const [rows] = await db.query(query, params);

  return rows;
}

/**
 * Tìm từ vựng theo content
 */
async function getVocabularyByContent(content) {
  if (!content) {
    const err = new Error('Content is required');
    err.status = 400;
    throw err;
  }

  const [rows] = await db.query(
    `SELECT * FROM vocabulary WHERE content = ? AND status = 'APPROVED' LIMIT 1`,
    [content]
  );

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Cập nhật từ vựng
 */
async function updateVocabulary(vocabularyId, data, userId) {
  if (!vocabularyId) {
    const err = new Error('Vocabulary ID is required');
    err.status = 400;
    throw err;
  }

  const {
    content,
    description,
    vocabularyType,
    isPrivate,
    imagesPath,
    videosPath,
    slug,
    note,
    topicId,
    classRoomId,
    lessonId,
    partId,
    status
  } = data;

  const fields = [];
  const params = [];

  if (content !== undefined) {
    fields.push('content = ?');
    params.push(content);
  }
  if (description !== undefined) {
    fields.push('description = ?');
    params.push(description);
  }
  if (vocabularyType !== undefined) {
    fields.push('vocabulary_type = ?');
    params.push(vocabularyType);
  }
  if (isPrivate !== undefined) {
    fields.push('is_private = ?');
    params.push(isPrivate ? 1 : 0);
  }
  if (imagesPath !== undefined) {
    fields.push('images_path = ?');
    params.push(imagesPath);
  }
  if (videosPath !== undefined) {
    fields.push('videos_path = ?');
    params.push(videosPath);
  }
  if (slug !== undefined) {
    fields.push('slug = ?');
    params.push(slug);
  }
  if (note !== undefined) {
    fields.push('note = ?');
    params.push(note);
  }
  if (topicId !== undefined) {
    fields.push('topic_id = ?');
    params.push(topicId);
  }
  if (classRoomId !== undefined) {
    fields.push('class_room_id = ?');
    params.push(classRoomId);
  }
  if (lessonId !== undefined) {
    fields.push('lesson_id = ?');
    params.push(lessonId);
  }
  if (partId !== undefined) {
    fields.push('part_id = ?');
    params.push(partId);
  }
  if (status !== undefined) {
    fields.push('status = ?');
    params.push(status);
  }

  if (fields.length === 0) {
    const err = new Error('Không có trường nào để cập nhật');
    err.status = 400;
    throw err;
  }

  fields.push('modified_by = ?', 'modified_date = NOW()');
  params.push(userId);
  params.push(vocabularyId);

  const [result] = await db.query(
    `UPDATE vocabulary SET ${fields.join(', ')} WHERE vocabulary_id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    const err = new Error('Từ vựng không tồn tại');
    err.status = 404;
    throw err;
  }

  return {
    vocabularyId,
    ...data,
    modifiedBy: userId,
    modifiedAt: new Date()
  };
}

/**
 * Cập nhật trạng thái từ vựng (phê duyệt/từ chối)
 */
async function updateVocabularyStatus(vocabularyId, status, userId) {
  if (!vocabularyId || !status) {
    const err = new Error('Vocabulary ID và status là bắt buộc');
    err.status = 400;
    throw err;
  }

  if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    const err = new Error('Status không hợp lệ');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    `UPDATE vocabulary SET status = ?, modified_by = ?, modified_date = NOW()
     WHERE vocabulary_id = ?`,
    [status, userId, vocabularyId]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Từ vựng không tồn tại');
    err.status = 404;
    throw err;
  }

  return {
    vocabularyId,
    status,
    modifiedBy: userId,
    modifiedAt: new Date()
  };
}

/**
 * Xóa từ vựng (hard delete)
 */
async function deleteVocabulary(vocabularyId) {
  if (!vocabularyId) {
    const err = new Error('Vocabulary ID is required');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    `DELETE FROM vocabulary WHERE vocabulary_id = ?`,
    [vocabularyId]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Từ vựng không tồn tại');
    err.status = 404;
    throw err;
  }

  return {
    message: 'Đã xóa từ vựng',
    vocabularyId
  };
}

/**
 * Xóa từ vựng theo topic
 */
async function deleteVocabulariesByTopicId(topicId) {
  if (!topicId) {
    const err = new Error('Topic ID is required');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    `DELETE FROM vocabulary WHERE topic_id = ?`,
    [topicId]
  );

  return {
    message: 'Đã xóa từ vựng theo chủ đề',
    topicId,
    deletedCount: result.affectedRows
  };
}

/**
 * Thống kê từ vựng
 */
async function getVocabularyStatistics(filters = {}) {
  const { classRoomId, topicId, lessonId } = filters;
  const params = [];

  let query = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN vocabulary_type = 'WORD' THEN 1 ELSE 0 END) as words,
      SUM(CASE WHEN vocabulary_type = 'SENTENCE' THEN 1 ELSE 0 END) as sentences,
      SUM(CASE WHEN vocabulary_type = 'PARAGRAPH' THEN 1 ELSE 0 END) as paragraphs
    FROM vocabulary
    WHERE 1=1
  `;

  if (classRoomId) {
    query += ' AND class_room_id = ?';
    params.push(classRoomId);
  }

  if (topicId) {
    query += ' AND topic_id = ?';
    params.push(topicId);
  }

  if (lessonId) {
    query += ' AND lesson_id = ?';
    params.push(lessonId);
  }

  const [[stats]] = await db.query(query, params);

  return {
    total: stats.total || 0,
    approved: stats.approved || 0,
    pending: stats.pending || 0,
    rejected: stats.rejected || 0,
    byType: {
      words: stats.words || 0,
      sentences: stats.sentences || 0,
      paragraphs: stats.paragraphs || 0
    }
  };
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
  createVocabulary,
  getVocabularies,
  getVocabularyById,
  getVocabularyBySlug,
  getVocabulariesByTopicId,
  getVocabulariesByClassroomId,
  getVocabulariesByLessonId,
  getVocabulariesByType,
  getVocabularyByContent,
  updateVocabulary,
  updateVocabularyStatus,
  deleteVocabulary,
  deleteVocabulariesByTopicId,
  getVocabularyStatistics,
  recordVocabularyView
};
