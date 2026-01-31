const db = require("../../../db");

/**
 * Service layer for classroom management.
 * Contains business logic for classroom operations.
 */

async function createClassroom(data, userId) {
  try {
    const { name, description, organizationId } = data;

    if (!name || !organizationId) {
      throw {
        status: 400,
        message: "Name and organizationId are required",
      };
    }

    const query = `
      INSERT INTO class_room (name, description, organization_id, created_by)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      name,
      description || null,
      organizationId,
      userId,
    ]);

    return {
      id: result.insertId,
      name,
      description,
      organizationId,
      createdBy: userId,
      createdAt: new Date(),
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || "Error creating classroom",
    };
  }
}

async function getClassrooms(query) {
  try {
    const { organizationId, page = 1, limit = 1000 } = query;
    const offset = (page - 1) * limit;

    // Query with join to get organization info
    let sqlQuery = `
      SELECT c.*, o.name as organization_name, o.type as organization_type
      FROM class_room c
      LEFT JOIN organization o ON c.organization_id = o.organization_id
      WHERE 1=1
    `;
    const params = [];

    // Filter by organizationId if provided
    if (organizationId) {
      sqlQuery += " AND c.organization_id = ?";
      params.push(organizationId);
    }

    // Get total count first
    let countQuery = `SELECT COUNT(*) as total FROM class_room WHERE 1=1`;
    const countParams = [];

    if (organizationId) {
      countQuery += " AND organization_id = ?";
      countParams.push(organizationId);
    }

    const [countRows] = await db.query(countQuery, countParams);
    const totalResult = countRows[0]?.total || 0;

    sqlQuery += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [classrooms] = await db.query(sqlQuery, params);

    return {
      data: classrooms,
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalResult,
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || "Error fetching classrooms",
    };
  }
}

async function getClassroomById(classroomId) {
  try {
    if (!classroomId) {
      throw {
        status: 400,
        message: "Classroom ID is required",
      };
    }

    const query = "SELECT * FROM class_room WHERE classroom_id = ?";

    const classroom = await new Promise((resolve, reject) => {
      db.query(query, [classroomId], (err, results) => {
        if (err) reject(err);
        else {
          if (results.length === 0) {
            reject({
              status: 404,
              message: "Classroom not found",
            });
          } else {
            resolve(results[0]);
          }
        }
      });
    });

    return classroom;
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || "Error fetching classroom",
    };
  }
}

async function updateClassroom(classroomId, data, userId) {
  try {
    if (!classroomId) {
      throw {
        status: 400,
        message: "Classroom ID is required",
      };
    }

    const { name, description } = data;

    let updateQuery = "UPDATE class_room SET ";
    const params = [];
    const fields = [];

    if (name !== undefined) {
      fields.push("name = ?");
      params.push(name);
    }

    if (description !== undefined) {
      fields.push("description = ?");
      params.push(description);
    }

    if (fields.length === 0) {
      throw {
        status: 400,
        message: "No fields to update",
      };
    }

    fields.push("updated_at = NOW()");
    updateQuery += fields.join(", ") + " WHERE classroom_id = ?";
    params.push(classroomId);

    await new Promise((resolve, reject) => {
      db.query(updateQuery, params, (err, result) => {
        if (err) reject(err);
        else {
          if (result.affectedRows === 0) {
            reject({
              status: 404,
              message: "Classroom not found",
            });
          } else {
            resolve(result);
          }
        }
      });
    });

    return {
      id: classroomId,
      ...data,
      updatedAt: new Date(),
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || "Error updating classroom",
    };
  }
}

async function deleteClassroom(classroomId, userId) {
  try {
    if (!classroomId) {
      throw {
        status: 400,
        message: "Classroom ID is required",
      };
    }

    const query = "DELETE FROM class_room WHERE classroom_id = ?";

    const result = await new Promise((resolve, reject) => {
      db.query(query, [classroomId], (err, result) => {
        if (err) reject(err);
        else {
          if (result.affectedRows === 0) {
            reject({
              status: 404,
              message: "Classroom not found",
            });
          } else {
            resolve(result);
          }
        }
      });
    });

    return {
      message: "Classroom deleted successfully",
      id: classroomId,
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || "Error deleting classroom",
    };
  }
}

async function addStudentToClassroom(classroomId, studentId, userId) {
  try {
    if (!classroomId || !studentId) {
      throw {
        status: 400,
        message: "Classroom ID and Student ID are required",
      };
    }

    // Check if student already in classroom
    const checkQuery =
      "SELECT * FROM class_student WHERE classroom_id = ? AND student_id = ?";
    const exists = await new Promise((resolve, reject) => {
      db.query(checkQuery, [classroomId, studentId], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0);
      });
    });

    if (exists) {
      throw {
        status: 400,
        message: "Student already in classroom",
      };
    }

    const insertQuery = `
      INSERT INTO class_student (classroom_id, student_id)
      VALUES (?, ?)
    `;

    await new Promise((resolve, reject) => {
      db.query(insertQuery, [classroomId, studentId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return {
      message: "Student added to classroom",
      classroomId,
      studentId,
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || "Error adding student to classroom",
    };
  }
}

async function removeStudentFromClassroom(classroomId, studentId, userId) {
  try {
    if (!classroomId || !studentId) {
      throw {
        status: 400,
        message: "Classroom ID and Student ID are required",
      };
    }

    const query =
      "DELETE FROM class_student WHERE classroom_id = ? AND student_id = ?";

    const result = await new Promise((resolve, reject) => {
      db.query(query, [classroomId, studentId], (err, result) => {
        if (err) reject(err);
        else {
          if (result.affectedRows === 0) {
            reject({
              status: 404,
              message: "Student not found in classroom",
            });
          } else {
            resolve(result);
          }
        }
      });
    });

    return {
      message: "Student removed from classroom",
      classroomId,
      studentId,
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || "Error removing student from classroom",
    };
  }
}

async function getClassroomStudents(classroomId, query) {
  try {
    if (!classroomId) {
      throw {
        status: 400,
        message: "Classroom ID is required",
      };
    }

    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const sqlQuery = `
      SELECT u.* FROM user u
      INNER JOIN class_student cs ON u.user_id = cs.student_id
      WHERE cs.classroom_id = ?
      LIMIT ? OFFSET ?
    `;

    const students = await new Promise((resolve, reject) => {
      db.query(sqlQuery, [classroomId, limit, offset], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    return {
      data: students,
      classroomId,
      page,
      limit,
      total: students.length,
    };
  } catch (err) {
    throw {
      status: err.status || 500,
      message: err.message || "Error fetching classroom students",
    };
  }
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
};
