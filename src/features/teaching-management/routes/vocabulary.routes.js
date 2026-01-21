// Vocabulary Routes - Aggregator
const express = require('express');
const vocabularyController = require('../controllers/vocabulary.controller');
const { authRequired } = require('../../../middleware/auth.middleware');
const checkOrgRole = require('../../../middleware/orgRole.middleware');

const router = express.Router();

router.post(
  '/',
  authRequired,
  checkOrgRole(['TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  vocabularyController.createVocabulary
);

router.get('/', authRequired, vocabularyController.getVocabularies);
router.get('/:vocabularyId', authRequired, vocabularyController.getVocabularyById);

router.put(
  '/:vocabularyId',
  authRequired,
  checkOrgRole(['TEACHER', 'SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  vocabularyController.updateVocabulary
);

router.delete(
  '/:vocabularyId',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  vocabularyController.deleteVocabulary
);

router.delete(
  '/topic/:topicId',
  authRequired,
  checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']),
  vocabularyController.deleteVocabulariesByTopic
);

module.exports = router;
