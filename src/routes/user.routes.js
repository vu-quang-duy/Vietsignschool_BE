const express = require("express");
const {
  getProfile,
  updateProfile,
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
  getStudentLearningProgress,
  getUsers,
  getUserById,
  createUser,
} = require("../controllers/user.controller");
const { authRequired } = require("../middleware/auth.middleware");
const checkOrgRole = require("../middleware/orgRole.middleware");
const checkOrgScope = require("../middleware/orgScope.middleware");

const router = express.Router();

router.get("/", authRequired, getUsers);

// Generic create user (for Admin/Facility Manager) - Restricted
router.post(
  "/",
  authRequired,
  checkOrgRole(["SUPER_ADMIN", "CENTER_ADMIN"]),
  createUser,
);

// User profile routes
router.get("/profile", authRequired, getProfile);
router.put("/profile", authRequired, updateProfile);

// Teacher CRUD routes
router.get("/teachers", authRequired, getTeachers);

router.post(
  "/teachers",
  authRequired,
  checkOrgRole(["SUPER_ADMIN", "CENTER_ADMIN", "SCHOOL_ADMIN"]),
  checkOrgScope(),
  createTeacher,
);

router.get("/teachers/:id", authRequired, getTeacherById);

router.put(
  "/teachers/:id",
  authRequired,
  checkOrgRole(["SUPER_ADMIN", "CENTER_ADMIN", "SCHOOL_ADMIN"]),
  checkOrgScope(),
  updateTeacher,
);

router.delete(
  "/teachers/:id",
  authRequired,
  checkOrgRole(["SUPER_ADMIN", "CENTER_ADMIN", "SCHOOL_ADMIN"]),
  checkOrgScope(),
  deleteTeacher,
);

// Student CRUD routes
router.get("/students", authRequired, getStudents);

router.post(
  "/students",
  authRequired,
  checkOrgRole(["SUPER_ADMIN", "CENTER_ADMIN", "SCHOOL_ADMIN"]),
  checkOrgScope(),
  createStudent,
);

router.get("/students/:id", authRequired, getStudentById);

router.put(
  "/students/:id",
  authRequired,
  checkOrgRole(["SUPER_ADMIN", "CENTER_ADMIN", "SCHOOL_ADMIN"]),
  checkOrgScope(),
  updateStudent,
);

router.delete(
  "/students/:id",
  authRequired,
  checkOrgRole(["SUPER_ADMIN", "CENTER_ADMIN", "SCHOOL_ADMIN"]),
  checkOrgScope(),
  deleteStudent,
);

// Student learning tracking routes (student access own data)
router.post("/students/tracking/view-lesson", authRequired, viewLesson);
router.post("/students/tracking/view-vocabulary", authRequired, viewVocabulary);
router.get(
  "/students/progress/learning",
  authRequired,
  getStudentLearningProgress,
);

// Generic GET user by ID must be at the end to avoid conflicts
router.get("/:id", authRequired, getUserById);

module.exports = router;
