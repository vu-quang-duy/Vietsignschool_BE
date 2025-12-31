const express = require("express");
const pool = require("../db");
const router = express.Router();
const authRequired = require("../middleware/auth.middleware").authRequired;
// 1. Gán quyền quản lý tổ chức

// 2. Thu hồi quyền quản lý tổ chức