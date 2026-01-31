/**
 * Classroom Service
 * Quản lý lớp học theo schema vietsignschool.sql
 * Table: class_room (class_room_id, content, class_code, class_level, status,
 *        teacher_id, school_id, image_location, thumbnail_path, description, is_teacher_created, slug, is_active)
 * Table: class_student (class_student_id, class_room_id, user_id, status, created_date, modified_date)
 * Table: class_teacher (class_teacher_id, class_room_id, user_id, is_primary, created_date, modified_date)
 */

const db = require('../../../db');

/**
 * Tạo lớp học mới
 */
async function createClassroom(data, userId) {
  const {
    content,
    description,
    classLevel,
    classCode,
    schoolId,
    imageLocation,
    thumbnailPath,
    isTeacherCreated = 1
  } = data;

  if (!content) {
    const err = new Error('Tên lớp học là bắt buộc');
    err.status = 400;
    throw err;
  }

  // Generate class code if not provided
  const finalClassCode = classCode || generateClassCode();

  const [result] = await db.query(
    `INSERT INTO class_room
     (content, description, class_level, class_code, school_id, teacher_id,
      image_location, thumbnail_path, is_teacher_created, status, is_active, created_by, created_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, NOW())`,
    [
      content,
      description || null,
      classLevel || null,
      finalClassCode,
      schoolId || null,
      userId,
      imageLocation || null,
      thumbnailPath || null,
      isTeacherCreated,
      userId
    ]
  );

  return {
    classRoomId: result.insertId,
    content,
    description,
    classLevel,
    classCode: finalClassCode,
    schoolId,
    createdBy: userId,
    createdAt: new Date()
  };
}

/**
 * Generate random class code
 */
function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Lấy danh sách lớp học
 */
async function getClassrooms(query) {
  const { schoolId, teacherId, classLevel, status, page = 1, limit = 20 } = query;
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];

  let sqlQuery = `
    SELECT
      c.class_room_id,
      c.content AS name,
      c.description,
      c.class_level,
      c.class_code,
      c.status,
      c.is_active,
      c.school_id,
      c.teacher_id,
      c.image_location,
      c.thumbnail_path,
      c.is_teacher_created,
      c.slug,
      c.created_by,
      c.created_date,
      c.modified_by,
      c.modified_date,
      (SELECT COUNT(*) FROM class_student WHERE class_room_id = c.class_room_id AND (status = 'ACTIVE' OR status IS NULL)) AS student_count,
      (SELECT COUNT(*) FROM class_teacher WHERE class_room_id = c.class_room_id) AS teacher_count,
      (SELECT COUNT(*) FROM lesson WHERE class_room_id = c.class_room_id) AS lesson_count
    FROM class_room c
    WHERE c.is_active = 1
  `;

  if (schoolId) {
    sqlQuery += ' AND c.school_id = ?';
    params.push(schoolId);
  }

  if (teacherId) {
    sqlQuery += ' AND (c.teacher_id = ? OR EXISTS (SELECT 1 FROM class_teacher ct WHERE ct.class_room_id = c.class_room_id AND ct.user_id = ?))';
    params.push(teacherId, teacherId);
  }

  if (classLevel) {
    sqlQuery += ' AND c.class_level = ?';
    params.push(classLevel);
  }

  if (status) {
    sqlQuery += ' AND c.status = ?';
    params.push(status);
  }

  sqlQuery += ' ORDER BY c.created_date DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await db.query(sqlQuery, params);

  // Count total
  let countQuery = 'SELECT COUNT(*) as total FROM class_room c WHERE c.is_active = 1';
  const countParams = [];

  if (schoolId) {
    countQuery += ' AND c.school_id = ?';
    countParams.push(schoolId);
  }
  if (teacherId) {
    countQuery += ' AND (c.teacher_id = ? OR EXISTS (SELECT 1 FROM class_teacher ct WHERE ct.class_room_id = c.class_room_id AND ct.user_id = ?))';
    countParams.push(teacherId, teacherId);
  }
  if (classLevel) {
    countQuery += ' AND c.class_level = ?';
    countParams.push(classLevel);
  }
  if (status) {
    countQuery += ' AND c.status = ?';
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
 * Lấy chi tiết lớp học
 */
async function getClassroomById(classRoomId) {
  if (!classRoomId) {
    const err = new Error('Class room ID is required');
    err.status = 400;
    throw err;
  }

  const [rows] = await db.query(
    `SELECT
      c.class_room_id,
      c.content AS name,
      c.description,
      c.class_level,
      c.class_code,
      c.status,
      c.is_active,
      c.school_id,
      c.teacher_id,
      c.image_location,
      c.thumbnail_path,
      c.is_teacher_created,
      c.slug,
      c.created_by,
      c.created_date,
      c.modified_by,
      c.modified_date,
      u.name AS teacher_name,
      u.email AS teacher_email
    FROM class_room c
    LEFT JOIN user u ON c.teacher_id = u.user_id
    WHERE c.class_room_id = ?`,
    [classRoomId]
  );

  if (rows.length === 0) {
    const err = new Error('Lớp học không tồn tại');
    err.status = 404;
    throw err;
  }

  // Get students count
  const [[{ studentCount }]] = await db.query(
    `SELECT COUNT(*) as studentCount FROM class_student
     WHERE class_room_id = ? AND (status = 'ACTIVE' OR status IS NULL)`,
    [classRoomId]
  );

  // Get lessons count
  const [[{ lessonCount }]] = await db.query(
    `SELECT COUNT(*) as lessonCount FROM lesson WHERE class_room_id = ?`,
    [classRoomId]
  );

  return {
    ...rows[0],
    studentCount,
    lessonCount
  };
}

/**
 * Cập nhật lớp học
 */
async function updateClassroom(classRoomId, data, userId) {
  if (!classRoomId) {
    const err = new Error('Class room ID is required');
    err.status = 400;
    throw err;
  }

  const { content, description, classLevel, classCode, status, imageLocation, thumbnailPath, isActive } = data;

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
  if (classLevel !== undefined) {
    fields.push('class_level = ?');
    params.push(classLevel);
  }
  if (classCode !== undefined) {
    fields.push('class_code = ?');
    params.push(classCode);
  }
  if (status !== undefined) {
    fields.push('status = ?');
    params.push(status);
  }
  if (imageLocation !== undefined) {
    fields.push('image_location = ?');
    params.push(imageLocation);
  }
  if (thumbnailPath !== undefined) {
    fields.push('thumbnail_path = ?');
    params.push(thumbnailPath);
  }
  if (isActive !== undefined) {
    fields.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  if (fields.length === 0) {
    const err = new Error('Không có trường nào để cập nhật');
    err.status = 400;
    throw err;
  }

  fields.push('modified_by = ?', 'modified_date = NOW()');
  params.push(userId);
  params.push(classRoomId);

  const [result] = await db.query(
    `UPDATE class_room SET ${fields.join(', ')} WHERE class_room_id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    const err = new Error('Lớp học không tồn tại');
    err.status = 404;
    throw err;
  }

  return {
    classRoomId,
    ...data,
    modifiedBy: userId,
    modifiedAt: new Date()
  };
}

/**
 * Xóa lớp học (soft delete)
 */
async function deleteClassroom(classRoomId, userId) {
  if (!classRoomId) {
    const err = new Error('Class room ID is required');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    `UPDATE class_room SET is_active = 0, modified_by = ?, modified_date = NOW()
     WHERE class_room_id = ?`,
    [userId, classRoomId]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Lớp học không tồn tại');
    err.status = 404;
    throw err;
  }

  return {
    message: 'Đã xóa lớp học',
    classRoomId
  };
}

/**
 * Thêm học sinh vào lớp
 */
async function addStudentToClassroom(classRoomId, studentId, userId) {
  if (!classRoomId || !studentId) {
    const err = new Error('Class room ID và Student ID là bắt buộc');
    err.status = 400;
    throw err;
  }

  // Check if student already in classroom
  const [existing] = await db.query(
    `SELECT class_student_id, status FROM class_student
     WHERE class_room_id = ? AND user_id = ?`,
    [classRoomId, studentId]
  );

  if (existing.length > 0) {
    if (!existing[0].status || existing[0].status === 'ACTIVE') {
      const err = new Error('Học sinh đã có trong lớp');
      err.status = 400;
      throw err;
    }
    // Re-activate if previously left
    await db.query(
      `UPDATE class_student SET status = 'ACTIVE', modified_date = NOW()
       WHERE class_student_id = ?`,
      [existing[0].class_student_id]
    );
  } else {
    await db.query(
      `INSERT INTO class_student (class_room_id, user_id, status, created_date)
       VALUES (?, ?, 'ACTIVE', NOW())`,
      [classRoomId, studentId]
    );
  }

  return {
    message: 'Đã thêm học sinh vào lớp',
    classRoomId,
    studentId
  };
}

/**
 * Xóa học sinh khỏi lớp
 */
async function removeStudentFromClassroom(classRoomId, studentId, userId) {
  if (!classRoomId || !studentId) {
    const err = new Error('Class room ID và Student ID là bắt buộc');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    `UPDATE class_student SET status = 'LEFT', modified_date = NOW()
     WHERE class_room_id = ? AND user_id = ? AND (status = 'ACTIVE' OR status IS NULL)`,
    [classRoomId, studentId]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Học sinh không có trong lớp');
    err.status = 404;
    throw err;
  }

  return {
    message: 'Đã xóa học sinh khỏi lớp',
    classRoomId,
    studentId
  };
}

/**
 * Lấy danh sách học sinh trong lớp
 */
async function getClassroomStudents(classRoomId, query = {}) {
  if (!classRoomId) {
    const err = new Error('Class room ID is required');
    err.status = 400;
    throw err;
  }

  const { page = 1, limit = 20, status = 'ACTIVE' } = query;
  const offset = (Number(page) - 1) * Number(limit);

  const [students] = await db.query(
    `SELECT
      cs.class_student_id,
      cs.user_id AS student_id,
      cs.status,
      cs.created_date AS joined_at,
      u.name AS student_name,
      u.email AS student_email,
      u.avatar_location AS avatar,
      (SELECT COUNT(*) FROM part_view pv
       JOIN part p ON pv.part_id = p.part_id
       JOIN lesson l ON p.lesson_id = l.lesson_id
       WHERE pv.user_id = cs.user_id AND l.class_room_id = cs.class_room_id) AS parts_viewed,
      (SELECT COUNT(*) FROM vocabulary_view vv
       JOIN vocabulary v ON vv.vocabulary_id = v.vocabulary_id
       WHERE vv.user_id = cs.user_id AND v.class_room_id = cs.class_room_id) AS vocabularies_viewed
    FROM class_student cs
    JOIN user u ON cs.user_id = u.user_id
    WHERE cs.class_room_id = ? AND (cs.status = ? OR (? = 'ACTIVE' AND cs.status IS NULL)) AND u.is_deleted = 0
    ORDER BY cs.created_date DESC
    LIMIT ? OFFSET ?`,
    [classRoomId, status, status, Number(limit), Number(offset)]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM class_student cs
     JOIN user u ON cs.user_id = u.user_id
     WHERE cs.class_room_id = ? AND (cs.status = ? OR (? = 'ACTIVE' AND cs.status IS NULL)) AND u.is_deleted = 0`,
    [classRoomId, status, status]
  );

  return {
    data: students,
    classRoomId,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(Number(total) / Number(limit))
    }
  };
}

/**
 * Thêm giáo viên vào lớp
 */
async function addTeacherToClassroom(classRoomId, teacherId, isPrimary = false) {
  if (!classRoomId || !teacherId) {
    const err = new Error('Class room ID và Teacher ID là bắt buộc');
    err.status = 400;
    throw err;
  }

  // Check if teacher already in classroom
  const [existing] = await db.query(
    `SELECT class_teacher_id FROM class_teacher
     WHERE class_room_id = ? AND user_id = ?`,
    [classRoomId, teacherId]
  );

  if (existing.length > 0) {
    const err = new Error('Giáo viên đã được phân công vào lớp');
    err.status = 400;
    throw err;
  }

  await db.query(
    `INSERT INTO class_teacher (class_room_id, user_id, is_primary, created_date)
     VALUES (?, ?, ?, NOW())`,
    [classRoomId, teacherId, isPrimary ? 1 : 0]
  );

  return {
    message: 'Đã thêm giáo viên vào lớp',
    classRoomId,
    teacherId,
    isPrimary
  };
}

/**
 * Xóa giáo viên khỏi lớp
 */
async function removeTeacherFromClassroom(classRoomId, teacherId) {
  if (!classRoomId || !teacherId) {
    const err = new Error('Class room ID và Teacher ID là bắt buộc');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    `DELETE FROM class_teacher WHERE class_room_id = ? AND user_id = ?`,
    [classRoomId, teacherId]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Giáo viên không có trong lớp');
    err.status = 404;
    throw err;
  }

  return {
    message: 'Đã xóa giáo viên khỏi lớp',
    classRoomId,
    teacherId
  };
}

/**
 * Lấy danh sách giáo viên trong lớp
 */
async function getClassroomTeachers(classRoomId) {
  if (!classRoomId) {
    const err = new Error('Class room ID is required');
    err.status = 400;
    throw err;
  }

  const [teachers] = await db.query(
    `SELECT
      ct.class_teacher_id,
      ct.user_id AS teacher_id,
      ct.is_primary,
      ct.created_date AS assigned_at,
      u.name AS teacher_name,
      u.email AS teacher_email,
      u.avatar_location AS avatar
    FROM class_teacher ct
    JOIN user u ON ct.user_id = u.user_id
    WHERE ct.class_room_id = ? AND u.is_deleted = 0
    ORDER BY ct.is_primary DESC, ct.created_date ASC`,
    [classRoomId]
  );

  return {
    data: teachers,
    classRoomId
  };
}

module.exports = {
  createClassroom,
  getClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom,
  addStudentToClassroom,
  removeStudentFromClassroom,
  getClassroomStudents,
  addTeacherToClassroom,
  removeTeacherFromClassroom,
  getClassroomTeachers
};
