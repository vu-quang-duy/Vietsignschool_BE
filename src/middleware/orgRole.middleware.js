const db = require('../db');

async function orgRoleMiddleware(req, res, next) {
    try {
        const userId = req.user.user_id;
        const orgId = req.params.id || req.body.organization_id;
        if (!orgId) {
            return res.status(400).json({ message: 'Organization ID is required.' });
        }
        const [rows] = await db.query(
            `SELECT role FROM user_organization 
             WHERE user_id = ? AND organization_id = ? AND status = 'ACTIVE' LIMIT 1`,
            [userId, orgId]
        );
        if (rows.length === 0) {
            return res.status(403).json({ message: 'Access denied. You are not a member of this organization.' });
        }
        req.userRole = rows[0].role;
        next();
    } catch (error) {
        console.error('Error in orgRoleMiddleware:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
module.exports = { orgRoleMiddleware };
