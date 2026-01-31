const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middleware/auth.middleware");
const checkOrgScope = require("../middleware/orgScope.middleware");
const checkOrgRole = require("../middleware/orgRole.middleware");
const controllers = require("../controllers/organizationManager.controller");

// Route to get users by organization (teachers, managers, etc.)
router.get("/", auth.authRequired, controllers.getUsersByOrganization);

// Route to add a manager to an organization (only SUPER_ADMIN or CENTER_ADMIN can add)
router.post(
  "/",
  auth.authRequired,
  checkOrgRole(["SUPER_ADMIN", "CENTER_ADMIN"]),
  checkOrgScope(),
  controllers.assignOrgRole,
);

// Route to remove a manager from an organization (only SUPER_ADMIN or CENTER_ADMIN can remove)
router.delete(
  "/",
  auth.authRequired,
  checkOrgRole(["SUPER_ADMIN", "CENTER_ADMIN"]),
  checkOrgScope(),
  controllers.revokeOrgRole,
);
module.exports = router;
