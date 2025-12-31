const express = require("express");
const { getProfile, updateProfile } = require("../controllers/user.controller");
const { authRequired } = require("../middleware/auth.middleware");

const router = express.Router();
router.get("/profile", authRequired, getProfile);
router.put("/profile", authRequired, updateProfile);
module.exports = router;
