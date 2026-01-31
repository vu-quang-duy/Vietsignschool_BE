/**
 * Class Learning Constants
 * Các hằng số cho chức năng học tập theo lớp
 */

// Cấp lớp (Lớp 1 - 5)
const ClassLevel = Object.freeze({
  GRADE_1: 'Lớp 1',
  GRADE_2: 'Lớp 2',
  GRADE_3: 'Lớp 3',
  GRADE_4: 'Lớp 4',
  GRADE_5: 'Lớp 5',
});

// Trạng thái lớp học
const ClassStatus = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

// Trạng thái học sinh trong lớp
const ClassStudentStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  LEFT: 'LEFT',
});

// Loại từ vựng
const VocabularyType = Object.freeze({
  WORD: 'WORD',
  SENTENCE: 'SENTENCE',
  PARAGRAPH: 'PARAGRAPH',
});

// Trạng thái nội dung
const ContentStatus = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

// Helper functions
function isValidClassLevel(level) {
  return Object.values(ClassLevel).includes(level);
}

function isValidClassStatus(status) {
  return Object.values(ClassStatus).includes(status);
}

function isValidVocabularyType(type) {
  return Object.values(VocabularyType).includes(type);
}

function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = {
  ClassLevel,
  ClassStatus,
  ClassStudentStatus,
  VocabularyType,
  ContentStatus,
  isValidClassLevel,
  isValidClassStatus,
  isValidVocabularyType,
  generateClassCode,
};
