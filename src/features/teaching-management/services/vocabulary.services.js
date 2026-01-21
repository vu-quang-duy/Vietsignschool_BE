const db = require('../../../db');

/**
 * Service layer for vocabulary management.
 * Contains business logic for vocabulary operations.
 */

async function createVocabulary(data, userId) {
  try {
    const { content, meaning, example, topic_id, classroom_id, vocabulary_type, is_private, pronunciation } = data;

    if (!content) {
      throw {
        status: 400,
        message: 'Content is required'
      };
    }

    const query = `
      INSERT INTO vocabularies (content, meaning, example, topic_id, classroom_id, vocabulary_type, is_private, pronunciation, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await new Promise((resolve, reject) => {
      db.query(query, [content, meaning || null, example || null, topic_id || null, classroom_id || null, vocabulary_type || 'WORD', is_private || 0, pronunciation || null, userId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return {
      id: result.insertId,
      content,
      meaning,
      example,
      topic_id,
      classroom_id,
      vocabulary_type,
      is_private,
      pronunciation,
      created_by: userId,
      created_at: new Date()
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error creating vocabulary'
    };
  }
}

async function getVocabularies(filters) {
  try {
    const { page = 1, limit = 20, q = '', topic_id, classroom_id, vocabulary_type, is_private, is_active } = filters;
    const offset = (page - 1) * limit;

    let sqlQuery = 'SELECT * FROM vocabularies WHERE 1=1';
    const params = [];

    if (q) {
      sqlQuery += ' AND (content LIKE ? OR meaning LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    if (topic_id) {
      sqlQuery += ' AND topic_id = ?';
      params.push(topic_id);
    }

    if (classroom_id) {
      sqlQuery += ' AND classroom_id = ?';
      params.push(classroom_id);
    }

    if (vocabulary_type) {
      sqlQuery += ' AND vocabulary_type = ?';
      params.push(vocabulary_type);
    }

    if (is_private !== null && is_private !== undefined) {
      sqlQuery += ' AND is_private = ?';
      params.push(is_private);
    }

    if (is_active !== undefined) {
      sqlQuery += ' AND is_active = ?';
      params.push(is_active);
    }

    sqlQuery += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const vocabularies = await new Promise((resolve, reject) => {
      db.query(sqlQuery, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return {
      data: vocabularies,
      page,
      limit,
      total: vocabularies.length
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching vocabularies'
    };
  }
}

async function getVocabularyById(vocabularyId) {
  try {
    if (!vocabularyId) {
      throw {
        status: 400,
        message: 'Vocabulary ID is required'
      };
    }

    const query = 'SELECT * FROM vocabularies WHERE id = ?';

    const vocabulary = await new Promise((resolve, reject) => {
      db.query(query, [vocabularyId], (err, results) => {
        if (err) reject(err);
        else {
          if (results.length === 0) {
            reject({
              status: 404,
              message: 'Vocabulary not found'
            });
          } else {
            resolve(results[0]);
          }
        }
      });
    });

    return vocabulary;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching vocabulary'
    };
  }
}

async function getVocabulariesByTopicId(topicId) {
  try {
    if (!topicId) {
      throw {
        status: 400,
        message: 'Topic ID is required'
      };
    }

    const query = 'SELECT * FROM vocabularies WHERE topic_id = ? ORDER BY id ASC';

    const vocabularies = await new Promise((resolve, reject) => {
      db.query(query, [topicId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return vocabularies;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching vocabularies by topic'
    };
  }
}

async function getVocabulariesByClassroomId(classroomId) {
  try {
    if (!classroomId) {
      throw {
        status: 400,
        message: 'Classroom ID is required'
      };
    }

    const query = 'SELECT * FROM vocabularies WHERE classroom_id = ? ORDER BY id ASC';

    const vocabularies = await new Promise((resolve, reject) => {
      db.query(query, [classroomId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return vocabularies;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching vocabularies by classroom'
    };
  }
}

async function getVocabulariesByType(vocabularyType, filters) {
  try {
    if (!vocabularyType) {
      throw {
        status: 400,
        message: 'Vocabulary type is required'
      };
    }

    const { topic_id, classroom_id, is_active } = filters;

    let query = 'SELECT * FROM vocabularies WHERE vocabulary_type = ?';
    const params = [vocabularyType];

    if (topic_id) {
      query += ' AND topic_id = ?';
      params.push(topic_id);
    }

    if (classroom_id) {
      query += ' AND classroom_id = ?';
      params.push(classroom_id);
    }

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active);
    }

    query += ' ORDER BY id ASC';

    const vocabularies = await new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return vocabularies;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching vocabularies by type'
    };
  }
}

async function getVocabularyByContent(content) {
  try {
    if (!content) {
      throw {
        status: 400,
        message: 'Content is required'
      };
    }

    const query = 'SELECT * FROM vocabularies WHERE content = ? LIMIT 1';

    const vocabulary = await new Promise((resolve, reject) => {
      db.query(query, [content], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0 ? results[0] : null);
      });
    });

    return vocabulary;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching vocabulary by content'
    };
  }
}

async function updateVocabulary(vocabularyId, data, userId) {
  try {
    if (!vocabularyId) {
      throw {
        status: 400,
        message: 'Vocabulary ID is required'
      };
    }

    const { content, meaning, example, pronunciation } = data;

    let updateQuery = 'UPDATE vocabularies SET ';
    const params = [];
    const fields = [];

    if (content !== undefined) {
      fields.push('content = ?');
      params.push(content);
    }

    if (meaning !== undefined) {
      fields.push('meaning = ?');
      params.push(meaning);
    }

    if (example !== undefined) {
      fields.push('example = ?');
      params.push(example);
    }

    if (pronunciation !== undefined) {
      fields.push('pronunciation = ?');
      params.push(pronunciation);
    }

    if (fields.length === 0) {
      throw {
        status: 400,
        message: 'No fields to update'
      };
    }

    fields.push('updated_at = NOW()');
    updateQuery += fields.join(', ') + ' WHERE id = ?';
    params.push(vocabularyId);

    await new Promise((resolve, reject) => {
      db.query(updateQuery, params, (err, result) => {
        if (err) reject(err);
        else {
          if (result.affectedRows === 0) {
            reject({
              status: 404,
              message: 'Vocabulary not found'
            });
          } else {
            resolve(result);
          }
        }
      });
    });

    return {
      id: vocabularyId,
      ...data,
      updated_at: new Date()
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error updating vocabulary'
    };
  }
}

async function deleteVocabulary(vocabularyId, userId) {
  try {
    if (!vocabularyId) {
      throw {
        status: 400,
        message: 'Vocabulary ID is required'
      };
    }

    const query = 'DELETE FROM vocabularies WHERE id = ?';

    const result = await new Promise((resolve, reject) => {
      db.query(query, [vocabularyId], (err, result) => {
        if (err) reject(err);
        else {
          if (result.affectedRows === 0) {
            reject({
              status: 404,
              message: 'Vocabulary not found'
            });
          } else {
            resolve(result);
          }
        }
      });
    });

    return {
      message: 'Vocabulary deleted successfully',
      id: vocabularyId
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error deleting vocabulary'
    };
  }
}

async function deleteVocabulariesByTopicId(topicId, userId) {
  try {
    if (!topicId) {
      throw {
        status: 400,
        message: 'Topic ID is required'
      };
    }

    const query = 'DELETE FROM vocabularies WHERE topic_id = ?';

    const result = await new Promise((resolve, reject) => {
      db.query(query, [topicId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return {
      message: 'Vocabularies deleted successfully',
      topic_id: topicId,
      deleted_count: result.affectedRows
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error deleting vocabularies'
    };
  }
}

async function getVocabularyStatistics(classroomId, topicId) {
  try {
    let query = 'SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active FROM vocabularies WHERE 1=1';
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
      message: err.message || 'Error fetching vocabulary statistics'
    };
  }
}

module.exports = {
  createVocabulary,
  getVocabularies,
  getVocabularyById,
  getVocabulariesByTopicId,
  getVocabulariesByClassroomId,
  getVocabulariesByType,
  getVocabularyByContent,
  updateVocabulary,
  deleteVocabulary,
  deleteVocabulariesByTopicId,
  getVocabularyStatistics
};
