/**
 * User constants - Roles, Status, Grades
 * Đồng bộ với FE (vietsign/src/data/usersData.ts)
 */

// Vai trò người dùng 
const UserRole = Object.freeze({
  ADMIN: 'ADMIN',                     // Quản trị viên
  FACILITY_MANAGER: 'FACILITY_MANAGER', // Quản lý cơ sở
  TEACHER: 'TEACHER',                 // Giáo viên
  STUDENT: 'STUDENT',                 // Học sinh
  USER: 'USER',                       // Người dùng
  TESTER: 'TESTER',                   // Tester
});

// Labels cho vai trò 
const RoleLabels = Object.freeze({
  ADMIN: 'Quản trị viên',
  FACILITY_MANAGER: 'Quản lý cơ sở',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
  USER: 'Người dùng',
  TESTER: 'Tester',
});

// Trạng thái người dùng 
const UserStatus = Object.freeze({
  ACTIVE: 'active',       // Hoạt động
  INACTIVE: 'inactive',   // Không hoạt động
});

// Labels cho trạng thái
const StatusLabels = Object.freeze({
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
});

// Trạng thái tổ chức - UPPERCASE theo actual DB schema
const OrganizationStatus = Object.freeze({
  ACTIVE: 'ACTIVE',     // Đang hoạt động
  INACTIVE: 'INACTIVE', // Tạm ngưng
});

// Labels cho trạng thái tổ chức
const OrganizationStatusLabels = Object.freeze({
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Tạm ngưng',
});

// Loại tổ chức - theo actual DB schema
const OrganizationType = Object.freeze({
  EDU_SYSTEM: 'EDU_SYSTEM',   // Bộ Giáo dục
  CENTER: 'CENTER',           // Sở/Trung tâm
  SCHOOL: 'SCHOOL',           // Trường học
  DEPARTMENT: 'DEPARTMENT',   // Phòng ban
  FACILITY: 'FACILITY',       // Cơ sở
});

// Labels cho loại tổ chức
const OrganizationTypeLabels = Object.freeze({
  EDU_SYSTEM: 'Bộ Giáo dục',
  CENTER: 'Sở/Trung tâm',
  SCHOOL: 'Trường học',
  DEPARTMENT: 'Phòng ban',
  FACILITY: 'Cơ sở',
});

// Lớp học (dành cho học sinh - lớp 1 đến 5)
const StudentGrade = Object.freeze({
  GRADE_1: 1,
  GRADE_2: 2,
  GRADE_3: 3,
  GRADE_4: 4,
  GRADE_5: 5,
});

// Labels cho lớp học 
const GradeLabels = Object.freeze({
  1: 'Lớp 1',
  2: 'Lớp 2',
  3: 'Lớp 3',
  4: 'Lớp 4',
  5: 'Lớp 5',
});

// Giới tính
const Gender = Object.freeze({
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
});

// Helper functions
function isValidRole(role) {
  return Object.values(UserRole).includes(role);
}

function isValidStatus(status) {
  return Object.values(UserStatus).includes(status);
}

function isValidOrganizationStatus(status) {
  return Object.values(OrganizationStatus).includes(status);
}

function isValidGrade(grade) {
  const gradeNum = Number(grade);
  return gradeNum >= 1 && gradeNum <= 5;
}

function isValidGender(gender) {
  return Object.values(Gender).includes(gender);
}

function getRoleLabel(role) {
  return RoleLabels[role] || role;
}

function getStatusLabel(status) {
  return StatusLabels[status] || status;
}

function getGradeLabel(grade) {
  return GradeLabels[grade] || `Lớp ${grade}`;
}

function getOrganizationStatusLabel(status) {
  return OrganizationStatusLabels[status] || status;
}

function isValidOrganizationType(type) {
  return Object.values(OrganizationType).includes(type);
}

function getOrganizationTypeLabel(type) {
  return OrganizationTypeLabels[type] || type;
}

module.exports = {
  UserRole,
  RoleLabels,
  UserStatus,
  StatusLabels,
  OrganizationStatus,
  OrganizationStatusLabels,
  OrganizationType,
  OrganizationTypeLabels,
  StudentGrade,
  GradeLabels,
  Gender,
  isValidRole,
  isValidStatus,
  isValidOrganizationStatus,
  isValidOrganizationType,
  isValidGrade,
  isValidGender,
  getRoleLabel,
  getStatusLabel,
  getGradeLabel,
  getOrganizationStatusLabel,
  getOrganizationTypeLabel,
};
