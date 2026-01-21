const db = require('../db');

/**
 * Service layer for teacher management.
 * Functions throw Error with optional `status` property for HTTP handling.
 */

async function createTeacher(payload, createdBy) {
  try {
    const {
      name,
      birthDay,
      address,
      classRoomName,
      schoolName,
      email,
      phoneNumber
    } = payload || {};

    let schoolId = undefined;
    let classRoomId = undefined;

    // find classroom id if provided
    if (classRoomName) {
      const [rows] = await db.query(
        'SELECT classroom_id FROM class_room WHERE name = ? LIMIT 1',
        [classRoomName]
      );
      if (rows.length > 0) classRoomId = rows[0].classroom_id;
    }

    // find school id if provided
    if (schoolName) {
      const [rows] = await db.query(
        'SELECT school_id FROM school WHERE name = ? LIMIT 1',
        [schoolName]
      );
      if (rows.length > 0) schoolId = rows[0].school_id;
    }

    const password = phoneNumber || '123456';
    const code = 'TEACHER';
    const isDeleted = 0;

    if (!name || !email) {
      const err = new Error('Missing required fields: name, email');
      err.status = 400;
      throw err;
    }

    // check if user email exists
    const [exists] = await db.query(
      'SELECT user_id FROM `user` WHERE email = ? LIMIT 1',
      [email]
    );
    if (exists.length > 0) {
      const err = new Error('Email already exists');
      err.status = 409;
      throw err;
    }

    // insert into primary `user` table
    const [result] = await db.query(
      `INSERT INTO \`user\` (name, birth_day, address, email, password, code, school_id, is_deleted, phone_number, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        birthDay || null,
        address || null,
        email,
        password,
        code,
        schoolId || null,
        isDeleted,
        phoneNumber || null,
        createdBy || 'system'
      ]
    );

    const userId = result.insertId;

    // insert mapping into class_teacher if classroom found
    if (classRoomId) {
      await db.query(
        `INSERT INTO class_teacher (teacher_id, classroom_id) VALUES (?, ?)`,
        [userId, classRoomId]
      );
    }

    // optional: write to secondary DB if configured (DB_B_*)
    if (process.env.DB_B_HOST) {
      try {
        const mysql = require('mysql2/promise');
        const poolB = mysql.createPool({
          host: process.env.DB_B_HOST,
          port: Number(process.env.DB_B_PORT || 3306),
          user: process.env.DB_B_USER,
          password: process.env.DB_B_PASSWORD,
          database: process.env.DB_B_NAME,
          waitForConnections: true,
          connectionLimit: 5,
        });

        await poolB.query(
          `INSERT INTO user_b (name, birth_day, address, email, password, code, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, birthDay || null, address || null, email, password, code, isDeleted]
        );
      } catch (e) {
        console.warn('Warning: Failed to write to secondary DB:', e.message);
      }
    }

    return { message: 'Teacher created successfully', userId };
  } catch (error) {
    throw error;
  }
}

async function getTeachers({ page = 1, limit = 20, q = '', school_id } = {}) {
  try {
    const offset = (Number(page) - 1) * Number(limit);

    const where = ['is_deleted = 0'];
    const params = [];

    if (q) {
      where.push('(name LIKE ? OR email LIKE ? OR phone_number LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    if (school_id) {
      where.push('school_id = ?');
      params.push(school_id);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT * FROM teacher ${whereSql} ORDER BY teacher_id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await Promise.all([
      db.query(`SELECT COUNT(1) as total FROM teacher ${whereSql}`, params)
    ]).then(results => results);

    return {
      teachers: rows.map(r => {
        try { r.subjects = r.subjects ? JSON.parse(r.subjects) : null; } catch(e) { r.subjects = r.subjects; }
        return r;
      }),
      meta: { page: Number(page), limit: Number(limit), total: Number(total) }
    };
  } catch (error) {
    throw error;
  }
}

async function getTeacherById(teacherId) {
  try {
    const [rows] = await db.query('SELECT * FROM teacher WHERE teacher_id = ? AND is_deleted = 0 LIMIT 1', [teacherId]);
    if (rows.length === 0) {
      const err = new Error('Teacher not found');
      err.status = 404;
      throw err;
    }
    const teacher = rows[0];
    try { teacher.subjects = teacher.subjects ? JSON.parse(teacher.subjects) : null; } catch(e) {}
    return teacher;
  } catch (error) {
    throw error;
  }
}

async function updateTeacher(teacherId, body, modifiedBy) {
  try {
    const raw = body || {};
    const updates = [];
    const values = [];

    const has = (k) => Object.prototype.hasOwnProperty.call(raw, k);

    const setIf = (key, column) => {
      if (has(key)) {
        updates.push(`${column} = ?`);
        values.push(raw[key]);
      }
    };

    setIf('name', 'name');
    setIf('email', 'email');
    setIf('phone_number', 'phone_number');
    setIf('gender', 'gender');
    setIf('birth_day', 'birth_day');
    setIf('address', 'address');
    setIf('avatar_location', 'avatar_location');
    if (has('subjects')) {
      updates.push('subjects = ?');
      values.push(raw.subjects ? JSON.stringify(raw.subjects) : null);
    }
    setIf('school_id', 'school_id');
    setIf('code', 'code');
    if (has('is_deleted')) {
      updates.push('is_deleted = ?');
      values.push(raw.is_deleted ? 1 : 0);
    }

    if (updates.length === 0) {
      const err = new Error('No updatable fields provided');
      err.status = 400;
      throw err;
    }

    updates.push('modified_by = ?');
    values.push(modifiedBy || 'system');
    updates.push('modified_date = NOW()');
    values.push(teacherId);

    const [result] = await db.query(
      `UPDATE teacher SET ${updates.join(', ')} WHERE teacher_id = ?`,
      values
    );

    if (!result || result.affectedRows === 0) {
      const err = new Error('Teacher not found (no rows updated)');
      err.status = 404;
      throw err;
    }

    const [rows] = await db.query('SELECT * FROM teacher WHERE teacher_id = ? LIMIT 1', [teacherId]);
    const teacher = rows[0] || null;
    try { teacher.subjects = teacher.subjects ? JSON.parse(teacher.subjects) : null; } catch(e) {}
    return teacher;
  } catch (error) {
    throw error;
  }
}

async function deleteTeacher(teacherId, modifiedBy) {
  try {
    const [result] = await db.query(
      `UPDATE teacher SET is_deleted = 1, modified_by = ?, modified_date = NOW() WHERE teacher_id = ?`,
      [modifiedBy || 'system', teacherId]
    );
    if (!result || result.affectedRows === 0) {
      const err = new Error('Teacher not found');
      err.status = 404;
      throw err;
    }
    return { message: 'Teacher deleted successfully' };
  } catch (error) {
    throw error;
  }
}

// Student CRUD operations
async function createStudent(payload, createdBy) {
  try {
    const {
      name,
      birthDay,
      address,
      classRoomName,
      schoolName,
      email,
      phoneNumber
    } = payload || {};

    let schoolId = undefined;
    let classRoomId = undefined;

    // find classroom id if provided
    if (classRoomName) {
      const [rows] = await db.query(
        'SELECT classroom_id FROM class_room WHERE name = ? LIMIT 1',
        [classRoomName]
      );
      if (rows.length > 0) classRoomId = rows[0].classroom_id;
    }

    // find school id if provided
    if (schoolName) {
      const [rows] = await db.query(
        'SELECT school_id FROM school WHERE name = ? LIMIT 1',
        [schoolName]
      );
      if (rows.length > 0) schoolId = rows[0].school_id;
    }

    const password = phoneNumber || '123456';
    const code = 'STUDENT';
    const isDeleted = 0;

    if (!name || !email) {
      const err = new Error('Missing required fields: name, email');
      err.status = 400;
      throw err;
    }

    // check if user email exists
    const [exists] = await db.query(
      'SELECT user_id FROM `user` WHERE email = ? LIMIT 1',
      [email]
    );
    if (exists.length > 0) {
      const err = new Error('Email already exists');
      err.status = 409;
      throw err;
    }

    // insert into primary `user` table
    const [result] = await db.query(
      `INSERT INTO \`user\` (name, birth_day, address, email, password, code, school_id, is_deleted, phone_number, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        birthDay || null,
        address || null,
        email,
        password,
        code,
        schoolId || null,
        isDeleted,
        phoneNumber || null,
        createdBy || 'system'
      ]
    );

    const userId = result.insertId;

    // create student profile
    const studentCode = `STU${userId}`;
    await db.query(
      `INSERT INTO student_profile (student_code, user_id) VALUES (?, ?)`,
      [studentCode, userId]
    );

    // insert mapping into class_student if classroom found
    if (classRoomId) {
      await db.query(
        `INSERT INTO class_student (student_id, classroom_id) VALUES (?, ?)`,
        [userId, classRoomId]
      );
    }

    // optional: write to secondary DB if configured (DB_B_*)
    if (process.env.DB_B_HOST) {
      try {
        const mysql = require('mysql2/promise');
        const poolB = mysql.createPool({
          host: process.env.DB_B_HOST,
          port: Number(process.env.DB_B_PORT || 3306),
          user: process.env.DB_B_USER,
          password: process.env.DB_B_PASSWORD,
          database: process.env.DB_B_NAME,
          waitForConnections: true,
          connectionLimit: 5,
        });

        await poolB.query(
          `INSERT INTO user_b (name, birth_day, address, email, password, code, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, birthDay || null, address || null, email, password, code, isDeleted]
        );
      } catch (e) {
        console.warn('Warning: Failed to write to secondary DB:', e.message);
      }
    }

    return { message: 'Student created successfully', userId };
  } catch (error) {
    throw error;
  }
}

async function getStudents({ page = 1, limit = 20, q = '', school_id } = {}) {
  try {
    const offset = (Number(page) - 1) * Number(limit);

    const where = ['is_deleted = 0', "code = 'STUDENT'"];
    const params = [];

    if (q) {
      where.push('(name LIKE ? OR email LIKE ? OR phone_number LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    if (school_id) {
      where.push('school_id = ?');
      params.push(school_id);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT * FROM user ${whereSql} ORDER BY user_id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await Promise.all([
      db.query(`SELECT COUNT(1) as total FROM user ${whereSql}`, params)
    ]).then(results => results);

    return {
      students: rows,
      meta: { page: Number(page), limit: Number(limit), total: Number(total) }
    };
  } catch (error) {
    throw error;
  }
}

async function getStudentById(studentId) {
  try {
    const [rows] = await db.query('SELECT * FROM user WHERE user_id = ? AND is_deleted = 0 AND code = ? LIMIT 1', [studentId, 'STUDENT']);
    if (rows.length === 0) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }
    return rows[0];
  } catch (error) {
    throw error;
  }
}

async function updateStudent(studentId, body, modifiedBy) {
  try {
    const raw = body || {};
    const updates = [];
    const values = [];

    const has = (k) => Object.prototype.hasOwnProperty.call(raw, k);

    const setIf = (key, column) => {
      if (has(key)) {
        updates.push(`${column} = ?`);
        values.push(raw[key]);
      }
    };

    setIf('name', 'name');
    setIf('email', 'email');
    setIf('phone_number', 'phone_number');
    setIf('gender', 'gender');
    setIf('birth_day', 'birth_day');
    setIf('address', 'address');
    setIf('avatar_location', 'avatar_location');
    setIf('school_id', 'school_id');
    if (has('is_deleted')) {
      updates.push('is_deleted = ?');
      values.push(raw.is_deleted ? 1 : 0);
    }

    if (updates.length === 0) {
      const err = new Error('No updatable fields provided');
      err.status = 400;
      throw err;
    }

    updates.push('modified_by = ?');
    values.push(modifiedBy || 'system');
    updates.push('modified_date = NOW()');
    values.push(studentId);

    const [result] = await db.query(
      `UPDATE user SET ${updates.join(', ')} WHERE user_id = ? AND code = ?`,
      [...values, 'STUDENT']
    );

    if (!result || result.affectedRows === 0) {
      const err = new Error('Student not found (no rows updated)');
      err.status = 404;
      throw err;
    }

    const [rows] = await db.query('SELECT * FROM user WHERE user_id = ? LIMIT 1', [studentId]);
    return rows[0] || null;
  } catch (error) {
    throw error;
  }
}

async function deleteStudent(studentId, modifiedBy) {
  try {
    const [result] = await db.query(
      `UPDATE user SET is_deleted = 1, modified_by = ?, modified_date = NOW() WHERE user_id = ? AND code = ?`,
      [modifiedBy || 'system', studentId, 'STUDENT']
    );
    if (!result || result.affectedRows === 0) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }
    return { message: 'Student deleted successfully' };
  } catch (error) {
    throw error;
  }
}

// Student learning tracking
async function viewLesson(studentId, lessonId) {
  try {
    if (!studentId || !lessonId) {
      const err = new Error('studentId and lessonId are required');
      err.status = 400;
      throw err;
    }

    const [lesson] = await db.query('SELECT lesson_id FROM lesson WHERE lesson_id = ? LIMIT 1', [lessonId]);
    if (lesson.length === 0) {
      const err = new Error('Lesson not found');
      err.status = 404;
      throw err;
    }

    const [view] = await db.query(
      'SELECT * FROM lesson_view WHERE student_id = ? AND lesson_id = ? LIMIT 1',
      [studentId, lessonId]
    );

    if (view.length === 0) {
      await db.query(
        'INSERT INTO lesson_view (student_id, lesson_id, view_count, last_viewed_at) VALUES (?, ?, 1, NOW())',
        [studentId, lessonId]
      );
    } else {
      await db.query(
        'UPDATE lesson_view SET view_count = view_count + 1, last_viewed_at = NOW() WHERE student_id = ? AND lesson_id = ?',
        [studentId, lessonId]
      );
    }

    return { message: 'Lesson viewed successfully' };
  } catch (error) {
    throw error;
  }
}

async function viewVocabulary(studentId, vocabularyId) {
  try {
    if (!studentId || !vocabularyId) {
      const err = new Error('studentId and vocabularyId are required');
      err.status = 400;
      throw err;
    }

    const [vocab] = await db.query('SELECT vocabulary_id FROM vocabulary WHERE vocabulary_id = ? LIMIT 1', [vocabularyId]);
    if (vocab.length === 0) {
      const err = new Error('Vocabulary not found');
      err.status = 404;
      throw err;
    }

    const [view] = await db.query(
      'SELECT * FROM vocabulary_view WHERE student_id = ? AND vocabulary_id = ? LIMIT 1',
      [studentId, vocabularyId]
    );

    if (view.length === 0) {
      await db.query(
        'INSERT INTO vocabulary_view (student_id, vocabulary_id, view_count, last_viewed_at) VALUES (?, ?, 1, NOW())',
        [studentId, vocabularyId]
      );
    } else {
      await db.query(
        'UPDATE vocabulary_view SET view_count = view_count + 1, last_viewed_at = NOW() WHERE student_id = ? AND vocabulary_id = ?',
        [studentId, vocabularyId]
      );
    }

    return { message: 'Vocabulary viewed successfully' };
  } catch (error) {
    throw error;
  }
}

async function getStudentLearningProgress(studentId) {
  try {
    // Get recent lesson views
    const [lessonViews] = await db.query(
      `SELECT lesson_id, view_count, last_viewed_at FROM lesson_view 
       WHERE student_id = ? ORDER BY last_viewed_at DESC LIMIT 10`,
      [studentId]
    );

    // Get recent vocabulary views
    const [vocabViews] = await db.query(
      `SELECT vocabulary_id, view_count, last_viewed_at FROM vocabulary_view 
       WHERE student_id = ? ORDER BY last_viewed_at DESC LIMIT 10`,
      [studentId]
    );

    return {
      lessonViews,
      vocabularyViews: vocabViews,
      lastActive: new Date()
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  viewLesson,
  viewVocabulary,
  getStudentLearningProgress
};
