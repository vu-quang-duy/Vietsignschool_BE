const db = require("../db");

const orgScopeMiddleware = (allowRoles = []) => {
  return async (req, res, next) => {
    try {
      // Null check for req.user
      if (!req.user || !req.user.user_id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const userId = req.user.user_id;
      // Check multiple possible parameter names: organization_id and id (used in routes like /:id)
      const orgId =
        req.params?.organization_id ||
        req.params?.id ||
        req.body?.organization_id ||
        req.query?.organization_id;

      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Lấy tất cả role của user
      const [roles] = await db.query(
        `
            SELECT role_in_org, organization_id
            FROM organization_manager
            WHERE user_id = ?
            `,
        [userId],
      );

      // Nếu có SUPER_ADMIN ở BẤT KỲ org nào → cho qua
      const isSuperAdmin = roles.some((r) => r.role_in_org === "SUPER_ADMIN");

      if (isSuperAdmin) {
        req.orgRole = "SUPER_ADMIN";
        req.organization_id = orgId;
        return next();
      }

      // Kiểm tra role trong org cụ thể
      const [row] = await db.query(
        `
            SELECT role_in_org
            FROM organization_manager
            WHERE user_id = ? AND organization_id = ?
            `,
        [userId, orgId],
      );

      if (row.length === 0) {
        return res.status(403).json({
          error: "Access denied: User is not part of the organization",
        });
      }

      const userRole = row[0].role_in_org;
      if (!allowRoles.includes(userRole)) {
        return res
          .status(403)
          .json({ error: "Access denied: Insufficient role permissions" });
      }

      req.orgRole = userRole;
      req.organization_id = orgId;

      next();
    } catch (error) {
      console.error("Error in orgScopeMiddleware:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

module.exports = orgScopeMiddleware;
