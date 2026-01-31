const express = require("express");
const pool = require("../db");
const router = express.Router();
const authRequired = require("../middleware/auth.middleware").authRequired;
const { orgRoleMiddleware } = require("../middleware/orgRole.middleware");

// GET users by organization
async function getUsersByOrganization(req, res) {
  try {
    const { organization_id, role_in_org } = req.query;

    if (!organization_id) {
      return res.status(400).json({ message: "organization_id is required" });
    }

    let query = `
            SELECT 
                u.user_id as id,
                u.name,
                u.email,
                u.phone_number as phone,
                u.code as role,
                om.role_in_org,
                om.is_primary
            FROM organization_manager om
            INNER JOIN user u ON om.user_id = u.user_id
            WHERE om.organization_id = ? AND u.is_deleted = 0
        `;
    const params = [organization_id];

    // Optional filter by role_in_org (TEACHER, FACILITY_MANAGER, etc.)
    if (role_in_org) {
      query += " AND om.role_in_org = ?";
      params.push(role_in_org);
    }

    query += " ORDER BY u.name ASC";

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      users: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("Error getting users by organization:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// 1. Gán quyền quản lý tổ chức

async function assignOrgRole(req, res) {
  try {
    console.log("assignOrgRole called with body:", req.body);
    console.log("req.orgRole:", req.orgRole);

    const { organization_id, user_id, role_in_org, is_primary } = req.body;

    if (!organization_id || !user_id || !role_in_org) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Không cho gán bừa
    if (role_in_org === "SUPER_ADMIN" && req.orgRole !== "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ message: "Forbidden: Cannot assign SUPER_ADMIN role" });
    }

    // 2. Kiểm tra đã tồn tại chưa
    console.log("Checking if role exists...");
    const [exists] = await pool.query(
      `SELECT id FROM organization_manager
            WHERE organization_id = ? AND user_id = ?`,
      [organization_id, user_id],
    );

    if (exists.length > 0) {
      return res
        .status(409)
        .json({
          message: "Conflict: User already has a role in this organization",
        });
    }

    // 3. Nếu is_primary = true thì set tất cả các is_primary khác về false
    if (is_primary) {
      await pool.query(
        `UPDATE organization_manager
                SET is_primary = 0
                WHERE organization_id = ?`,
        [organization_id],
      );
    }

    // 4. Gán quyền
    await pool.query(
      `INSERT INTO organization_manager (organization_id, user_id, role_in_org, is_primary)
            VALUES (?, ?, ?, ?)`,
      [organization_id, user_id, role_in_org, is_primary ? 1 : 0],
    );
    return res.status(201).json({ message: "Role assigned successfully" });
  } catch (error) {
    console.error("Error assigning organization role:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
// 2. Thu hồi quyền quản lý tổ chức

async function revokeOrgRole(req, res) {
  try {
    const { organization_id, user_id } = req.body;

    if (!organization_id || !user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await pool.query(
      `DELETE FROM organization_manager
            WHERE organization_id = ? AND user_id = ?`,
      [organization_id, user_id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Not Found: No such role assignment" });
    }

    return res.status(200).json({ message: "Role revoked successfully" });
  } catch (error) {
    console.error("Error revoking organization role:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getUsersByOrganization,
  assignOrgRole,
  revokeOrgRole,
};
