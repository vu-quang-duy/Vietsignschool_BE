const db = require('../db');

async function isChildOrganization(parentId, childId) {
const [rows] = await db.query(
    `
    WITH RECURSIVE org_tree AS (
      SELECT organization_id, parent_id
      FROM organization
      WHERE organization_id = ?
      UNION ALL
      SELECT o.organization_id, o.parent_id
      FROM organization o
      JOIN org_tree t ON o.parent_id = t.organization_id
    )
    SELECT 1 FROM org_tree WHERE organization_id = ?
    `,
    [parentId, childId]);

    return  rows.length > 0;
}

module.exports = ()=> {
    return async (req, res, next) =>{
        try {
          const userId = req.user.user_id;
          const targetOrgId = req.params.organization_id || req.body.organization_id;
          
          if (!targetOrgId) {
              return res.status(400).json({ error: 'Organization ID is required' });
          }

            const [rows] = await db.query(
                `SELECT organization_id, role_in_org
                FROM organization_manager
                WHERE user_id = ?
                AND role_in_org IN ('SUPER_ADMIN', 'CENTER_ADMIN')`,
                [userId]
            )

            if (rows.length === 0) {
                return res.status(403).json({ error: 'Access denied: User does not have admin privileges' });
            }

            for (const row of rows) {
                if(
                    row.organization_id === Number(targetOrgId) ||
                    await isChildOrganization(row.organization_id, targetOrgId)
                ) {
                    return next();
                }
            }
            
            return res.status(403).json({ error: 'Access denied: Insufficient organization scope' });
        } catch (error) {
            console.error('Error in orgScopeMiddleware:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}