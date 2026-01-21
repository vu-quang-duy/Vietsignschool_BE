const db = require('../../../db');

/**
 * Service layer for lesson management.
 * Contains business logic for lesson operations.
 */

async function createLesson(data, userId) {
  try {
    const { name, description, topic_id, classroom_id, content, difficulty_level, order_number } = data;

    if (!name || !topic_id) {
      throw {
        status: 400,
        message: 'Name and topic_id are required'
      };
    }

    const query = `
      INSERT INTO lessons (name, description, topic_id, classroom_id, content, difficulty_level, order_number, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await new Promise((resolve, reject) => {
      db.query(query, [name, description || null, topic_id, classroom_id || null, content || null, difficulty_level || 'BEGINNER', order_number || 0, userId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return {
      id: result.insertId,
      name,
      description,
      topic_id,
      classroom_id,
      content,
      difficulty_level,
      order_number,
      created_by: userId,
      created_at: new Date()
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error creating lesson'
    };
  }
}

async function getLessons(filters) {
  try {
    const { page = 1, limit = 20, q = '', topic_id, classroom_id, difficulty_level, is_active } = filters;
    const offset = (page - 1) * limit;

    let sqlQuery = 'SELECT * FROM lessons WHERE 1=1';
    const params = [];

    if (q) {
      sqlQuery += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }

    if (topic_id) {
      sqlQuery += ' AND topic_id = ?';
      params.push(topic_id);
    }

    if (classroom_id) {
      sqlQuery += ' AND classroom_id = ?';
      params.push(classroom_id);
    }

    if (difficulty_level) {
      sqlQuery += ' AND difficulty_level = ?';
      params.push(difficulty_level);
    }

    if (is_active !== undefined) {
      sqlQuery += ' AND is_active = ?';
      params.push(is_active);
    }

    sqlQuery += ' ORDER BY order_number ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const lessons = await new Promise((resolve, reject) => {
      db.query(sqlQuery, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return {
      data: lessons,
      page,
      limit,
      total: lessons.length
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching lessons'
    };
  }
}

async function getLessonById(lessonId) {
  try {
    if (!lessonId) {
      throw {
        status: 400,
        message: 'Lesson ID is required'
      };
    }

    const query = 'SELECT * FROM lessons WHERE id = ?';

    const lesson = await new Promise((resolve, reject) => {
      db.query(query, [lessonId], (err, results) => {
        if (err) reject(err);
        else {
          if (results.length === 0) {
            reject({
              status: 404,
              message: 'Lesson not found'
            });
          } else {
            resolve(results[0]);
          }
        }
      });
    });

    return lesson;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching lesson'
    };
  }
}

async function getLessonsByTopicId(topicId) {
  try {
    if (!topicId) {
      throw {
        status: 400,
        message: 'Topic ID is required'
      };
    }

    const query = 'SELECT * FROM lessons WHERE topic_id = ? ORDER BY order_number ASC';

    const lessons = await new Promise((resolve, reject) => {
      db.query(query, [topicId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return lessons;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching lessons by topic'
    };
  }
}

async function getLessonsByClassroomId(classroomId) {
  try {
    if (!classroomId) {
      throw {
        status: 400,
        message: 'Classroom ID is required'
      };
    }

    const query = 'SELECT * FROM lessons WHERE classroom_id = ? ORDER BY order_number ASC';

    const lessons = await new Promise((resolve, reject) => {
      db.query(query, [classroomId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return lessons;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching lessons by classroom'
    };
  }
}

async function updateLesson(lessonId, data, userId) {
  try {
    if (!lessonId) {
      throw {
        status: 400,
        message: 'Lesson ID is required'
      };
    }

    const { name, description, content, difficulty_level, order_number } = data;

    let updateQuery = 'UPDATE lessons SET ';
    const params = [];
    const fields = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }

    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }

    if (content !== undefined) {
      fields.push('content = ?');
      params.push(content);
    }

    if (difficulty_level !== undefined) {
      fields.push('difficulty_level = ?');
      params.push(difficulty_level);
    }

    if (order_number !== undefined) {
      fields.push('order_number = ?');
      params.push(order_number);
    }

    if (fields.length === 0) {
      throw {
        status: 400,
        message: 'No fields to update'
      };
    }

    fields.push('updated_at = NOW()');
    updateQuery += fields.join(', ') + ' WHERE id = ?';
    params.push(lessonId);

    await new Promise((resolve, reject) => {
      db.query(updateQuery, params, (err, result) => {
        if (err) reject(err);
        else {
          if (result.affectedRows === 0) {
            reject({
              status: 404,
              message: 'Lesson not found'
            });
          } else {
            resolve(result);
          }
        }
      });
    });

    return {
      id: lessonId,
      ...data,
      updated_at: new Date()
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error updating lesson'
    };
  }
}

async function reorderLessons(topicId, lessons, userId) {
  try {
    if (!topicId || !Array.isArray(lessons) || lessons.length === 0) {
      throw {
        status: 400,
        message: 'Topic ID and lessons array are required'
      };
    }

    for (const lesson of lessons) {
      const query = 'UPDATE lessons SET order_number = ?, updated_at = NOW() WHERE id = ? AND topic_id = ?';
      
      await new Promise((resolve, reject) => {
        db.query(query, [lesson.order_number, lesson.lesson_id, topicId], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    return {
      message: 'Lessons reordered successfully',
      topicId,
      updatedCount: lessons.length
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error reordering lessons'
    };
  }
}

async function deleteLesson(lessonId, userId) {
  try {
    if (!lessonId) {
      throw {
        status: 400,
        message: 'Lesson ID is required'
      };
    }

    const query = 'DELETE FROM lessons WHERE id = ?';

    const result = await new Promise((resolve, reject) => {
      db.query(query, [lessonId], (err, result) => {
        if (err) reject(err);
        else {
          if (result.affectedRows === 0) {
            reject({
              status: 404,
              message: 'Lesson not found'
            });
          } else {
            resolve(result);
          }
        }
      });
    });

    return {
      message: 'Lesson deleted successfully',
      id: lessonId
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error deleting lesson'
    };
  }
}

async function deleteLessonsByTopicId(topicId, userId) {
  try {
    if (!topicId) {
      throw {
        status: 400,
        message: 'Topic ID is required'
      };
    }

    const query = 'DELETE FROM lessons WHERE topic_id = ?';

    const result = await new Promise((resolve, reject) => {
      db.query(query, [topicId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return {
      message: 'Lessons deleted successfully',
      topicId,
      deletedCount: result.affectedRows
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error deleting lessons'
    };
  }
}

async function getLessonStatistics(classroomId, topicId) {
  try {
    let query = 'SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM lessons WHERE 1=1';
    const params = [];

    if (classroomId) {
      query += ' AND classroom_id = ?';
      params.push(classroomId);
    }

    if (topicId) {
      query += ' AND topic_id = ?';
      params.push(topicId);
    }

    const stats = await new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || { total: 0, active: 0 });
      });
    });

    return stats;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching lesson statistics'
    };
  }
}

module.exports = {
  createLesson,
  getLessons,
  getLessonById,
  getLessonsByTopicId,
  getLessonsByClassroomId,
  updateLesson,
  reorderLessons,
  deleteLesson,
  deleteLessonsByTopicId,
  getLessonStatistics
};
