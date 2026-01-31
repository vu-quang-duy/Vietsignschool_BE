const classroomServices = require("../services/classroom.services");

/**
 * Controller layer for classroom management.
 * Handles HTTP requests and responses, delegates business logic to services.
 */

async function createClassroom(req, res) {
  try {
    const classroom = await classroomServices.createClassroom(
      req.body,
      req.user?.user_id,
    );
    return res.status(201).json(classroom);
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message });
  }
}

async function getClassrooms(req, res) {
  try {
    const result = await classroomServices.getClassrooms(req.query);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message });
  }
}

async function getClassroomById(req, res) {
  try {
    const classroom = await classroomServices.getClassroomById(
      req.params.classroomId,
    );
    return res.status(200).json(classroom);
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message });
  }
}

async function updateClassroom(req, res) {
  try {
    const classroom = await classroomServices.updateClassroom(
      req.params.classroomId,
      req.body,
      req.user?.user_id,
    );
    return res.status(200).json(classroom);
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message });
  }
}

async function deleteClassroom(req, res) {
  try {
    const result = await classroomServices.deleteClassroom(
      req.params.classroomId,
      req.user?.user_id,
    );
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message });
  }
}

async function addStudentToClassroom(req, res) {
  try {
    const result = await classroomServices.addStudentToClassroom(
      req.params.classroomId,
      req.body.studentId,
      req.user?.user_id,
    );
    return res.status(201).json(result);
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message });
  }
}

async function removeStudentFromClassroom(req, res) {
  try {
    const result = await classroomServices.removeStudentFromClassroom(
      req.params.classroomId,
      req.body.studentId,
      req.user?.user_id,
    );
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message });
  }
}

async function getClassroomStudents(req, res) {
  try {
    const result = await classroomServices.getClassroomStudents(
      req.params.classroomId,
      req.query,
    );
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message });
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
