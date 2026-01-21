
const express = require('express');
const router = express.Router();
const controller = require('../controllers/organization.controller');
const { authRequired } = require("../middleware/auth.middleware");
const checkOrgRole = require('../middleware/orgRole.middleware');

router.get('/', authRequired, controller.getAllOrganizations);
router.get('/:id', authRequired, controller.getOrganizationById);
router.post('/', authRequired, controller.createOrganization);
router.put('/:id', authRequired, controller.updateOrganization);
router.delete('/:id', authRequired, checkOrgRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN']), controller.deleteOrganization);
module.exports = router;