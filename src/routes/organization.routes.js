
const express = require('express');
const router = express.Router();
const controller = require('../controllers/organization.controller');
const { authRequired } = require("../middleware/auth.middleware");

router.get('/', authRequired, controller.getAllOrganizations);
router.get('/:id', authRequired, controller.getOrganizationById);
router.post('/', authRequired, controller.createOrganization);
router.put('/:id', authRequired, controller.updateOrganization);
router.delete('/:id', authRequired, controller.deleteOrganization);
module.exports = router;