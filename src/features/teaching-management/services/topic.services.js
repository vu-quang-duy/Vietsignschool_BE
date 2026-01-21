const db = require('../../../db');

/**
 * Service layer for topic management.
 * Contains business logic for topic operations.
 */

async function createTopic(name, classroomId, imageLocation, description, creatorId, isCommon) {
  try {
    if (!name) {
      throw {
        status: 400,
        message: 'Topic name is required'
      };
    }

    const query = `
      INSERT INTO topics (name, classroom_id, image_location, description, creator_id, is_common, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await new Promise((resolve, reject) => {
      db.query(query, [name, classroomId || null, imageLocation || null, description || null, creatorId || null, isCommon ? 1 : 0], (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            reject({
              status: 409,
              message: 'Topic name already exists'
            });
          } else {
            reject(err);
          }
        } else {
          resolve(result);
        }
      });
    });

    return {
      id: result.insertId,
      name,
      classroom_id: classroomId,
      image_location: imageLocation,
      description,
      creator_id: creatorId,
      is_common: isCommon ? 1 : 0,
      created_at: new Date()
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error creating topic'
    };
  }
}

async function getTopics(limit, offset, classroomId, creatorId, isCommon) {
  try {
    let query = 'SELECT * FROM topics WHERE 1=1';
    const params = [];

    if (classroomId) {
      query += ' AND classroom_id = ?';
      params.push(classroomId);
    }

    if (creatorId) {
      query += ' AND creator_id = ?';
      params.push(creatorId);
    }

    if (isCommon !== null && isCommon !== undefined) {
      query += ' AND is_common = ?';
      params.push(isCommon ? 1 : 0);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    
    const total = await new Promise((resolve, reject) => {
      db.query(countQuery, params, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const data = await new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return {
      data,
      total,
      limit,
      offset
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching topics'
    };
  }
}

async function getTopicById(topicId) {
  try {
    if (!topicId) {
      throw {
        status: 400,
        message: 'Topic ID is required'
      };
    }

    const query = 'SELECT * FROM topics WHERE id = ?';

    const topic = await new Promise((resolve, reject) => {
      db.query(query, [topicId], (err, results) => {
        if (err) reject(err);
        else {
          if (results.length === 0) {
            reject({
              status: 404,
              message: 'Topic not found'
            });
          } else {
            resolve(results[0]);
          }
        }
      });
    });

    return topic;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching topic'
    };
  }
}

async function getTopicsByClassroom(classroomId, limit, offset) {
  try {
    if (!classroomId) {
      throw {
        status: 400,
        message: 'Classroom ID is required'
      };
    }

    const countQuery = 'SELECT COUNT(*) as count FROM topics WHERE classroom_id = ?';
    
    const total = await new Promise((resolve, reject) => {
      db.query(countQuery, [classroomId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });

    const query = 'SELECT * FROM topics WHERE classroom_id = ? LIMIT ? OFFSET ?';

    const data = await new Promise((resolve, reject) => {
      db.query(query, [classroomId, limit, offset], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return {
      data,
      total,
      limit,
      offset
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching topics by classroom'
    };
  }
}

async function getTopicsByCreator(creatorId, limit, offset) {
  try {
    if (!creatorId) {
      throw {
        status: 400,
        message: 'Creator ID is required'
      };
    }

    const countQuery = 'SELECT COUNT(*) as count FROM topics WHERE creator_id = ?';
    
    const total = await new Promise((resolve, reject) => {
      db.query(countQuery, [creatorId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });

    const query = 'SELECT * FROM topics WHERE creator_id = ? LIMIT ? OFFSET ?';

    const data = await new Promise((resolve, reject) => {
      db.query(query, [creatorId, limit, offset], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return {
      data,
      total,
      limit,
      offset
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching topics by creator'
    };
  }
}

async function searchTopicsByName(name, limit, offset) {
  try {
    if (!name) {
      throw {
        status: 400,
        message: 'Search name is required'
      };
    }

    const searchTerm = `%${name}%`;
    const countQuery = 'SELECT COUNT(*) as count FROM topics WHERE name LIKE ?';
    
    const total = await new Promise((resolve, reject) => {
      db.query(countQuery, [searchTerm], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });

    const query = 'SELECT * FROM topics WHERE name LIKE ? LIMIT ? OFFSET ?';

    const data = await new Promise((resolve, reject) => {
      db.query(query, [searchTerm, limit, offset], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return {
      data,
      total,
      limit,
      offset
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error searching topics'
    };
  }
}

async function updateTopic(topicId, updates) {
  try {
    if (!topicId) {
      throw {
        status: 400,
        message: 'Topic ID is required'
      };
    }

    if (Object.keys(updates).length === 0) {
      throw {
        status: 400,
        message: 'No fields to update'
      };
    }

    let query = 'UPDATE topics SET ';
    const params = [];
    const fields = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description);
    }

    if (updates.image_location !== undefined) {
      fields.push('image_location = ?');
      params.push(updates.image_location);
    }

    if (updates.is_common !== undefined) {
      fields.push('is_common = ?');
      params.push(updates.is_common ? 1 : 0);
    }

    if (fields.length === 0) {
      throw {
        status: 400,
        message: 'No valid fields to update'
      };
    }

    fields.push('updated_at = NOW()');
    query += fields.join(', ') + ' WHERE id = ?';
    params.push(topicId);

    await new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            reject({
              status: 409,
              message: 'Topic name already exists'
            });
          } else {
            reject(err);
          }
        } else {
          if (result.affectedRows === 0) {
            reject({
              status: 404,
              message: 'Topic not found'
            });
          } else {
            resolve(result);
          }
        }
      });
    });

    return {
      id: topicId,
      ...updates,
      updated_at: new Date()
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error updating topic'
    };
  }
}

async function deleteTopic(topicId) {
  try {
    if (!topicId) {
      throw {
        status: 400,
        message: 'Topic ID is required'
      };
    }

    const query = 'DELETE FROM topics WHERE id = ?';

    const result = await new Promise((resolve, reject) => {
      db.query(query, [topicId], (err, result) => {
        if (err) reject(err);
        else {
          if (result.affectedRows === 0) {
            reject({
              status: 404,
              message: 'Topic not found'
            });
          } else {
            resolve(result);
          }
        }
      });
    });

    return {
      message: 'Topic deleted successfully',
      id: topicId
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error deleting topic'
    };
  }
}

async function deleteTopicsByClassroom(classroomId) {
  try {
    if (!classroomId) {
      throw {
        status: 400,
        message: 'Classroom ID is required'
      };
    }

    const query = 'DELETE FROM topics WHERE classroom_id = ?';

    const result = await new Promise((resolve, reject) => {
      db.query(query, [classroomId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return {
      message: 'Topics deleted successfully',
      classroom_id: classroomId,
      deletedCount: result.affectedRows
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error deleting topics'
    };
  }
}

async function getTopicStatistics(classroomId) {
  try {
    let query = 'SELECT COUNT(*) as total FROM topics WHERE 1=1';
    const params = [];

    if (classroomId) {
      query += ' AND classroom_id = ?';
      params.push(classroomId);
    }

    const stats = await new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || { total: 0 });
      });
    });

    return stats;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || 'Error fetching topic statistics'
    };
  }
}

module.exports = {
  createTopic,
  getTopics,
  getTopicById,
  getTopicsByClassroom,
  getTopicsByCreator,
  searchTopicsByName,
  updateTopic,
  deleteTopic,
  deleteTopicsByClassroom,
  getTopicStatistics
};
