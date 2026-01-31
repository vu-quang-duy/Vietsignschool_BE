const db = require("../db");
const slugify = require("slugify");

// GET all organizations /organizations

async function getAllOrganizations(req, res) {
  try {
    const { page = 1, limit = 100, q = "" } = req.query || {};
    const offset = (Number(page) - 1) * Number(limit);

    const where = ["status = 'ACTIVE'"];
    const params = [];

    if (q) {
      where.push("(name LIKE ? OR email LIKE ? OR phone LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT * FROM organization ${whereSql} ORDER BY organization_id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)],
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(1) as total FROM organization ${whereSql}`,
      params,
    );

    return res.json({
      organizations: rows,
      meta: { page: Number(page), limit: Number(limit), total: Number(total) },
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

// GET /organizations/:id
async function getOrganizationById(req, res) {
  try {
    const orgId = req.params.id;
    const [rows] = await db.query(
      `SELECT * FROM organization WHERE organization_id = ? AND status = 'ACTIVE' LIMIT 1`,
      [orgId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Organization not found" });
    }
    return res.json({ organization: rows[0] });
  } catch (error) {
    console.error("Error fetching organization by ID:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

// POST /organizations (create organization) - commented out in routes
async function createOrganization(req, res) {
  try {
    const {
      parent_id,
      name,
      type, // 'EDU_SYSTEM','CENTER','SCHOOL','DEPARTMENT','FACILITY
      address,
      city,
      ward,
      street,
      phone,
      email,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const slug = slugify(name, { lower: true, strict: true });

    // Validate parent
    if (parent_id) {
      const [parent] = await db.query(
        `SELECT * FROM organization WHERE organization_id = ?`,
        [parent_id],
      );

      if (parent.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid parent organization ID" });
      }
    }

    await db.query(
      `INSERT INTO organization
        (parent_id, name, slug, type, address, city, ward, street, phone, email, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parent_id || null,
        name,
        slug,
        type,
        address || null,
        city || null,
        ward || null,
        street || null,
        phone || null,
        email || null,
        req.user.email,
      ],
    );
    return res
      .status(201)
      .json({ message: "Organization created successfully", body: req.body });
  } catch (error) {
    console.error("Error creating organization:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

// UPDATE and DELETE functions
async function updateOrganization(req, res) {
  try {
    const orgId = req.params.id;
    const rawBody = req.body || {};
    const body =
      rawBody &&
      typeof rawBody === "object" &&
      rawBody.organization &&
      typeof rawBody.organization === "object"
        ? rawBody.organization
        : rawBody;

    const updates = [];
    const values = [];
    const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

    const pick = (primary, fallbacks = []) => {
      if (has(primary)) return body[primary];
      for (const key of fallbacks) {
        if (has(key)) return body[key];
      }
      return undefined;
    };

    const name = pick("name", ["organization_name", "org_name"]);
    const address = pick("address");
    const phone = pick("phone", ["phone_number"]);
    const email = pick("email");
    const status = pick("status");

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);

      const nextSlug = name
        ? slugify(String(name), { lower: true, strict: true })
        : null;
      updates.push("slug = ?");
      values.push(nextSlug);
    }

    if (address !== undefined) {
      updates.push("address = ?");
      values.push(address);
    }

    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }

    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "No updatable fields provided",
        allowedFields: ["name", "address", "phone", "email", "status"],
        receivedKeys: Object.keys(rawBody || {}),
        receivedOrganizationKeys:
          body !== rawBody ? Object.keys(body || {}) : undefined,
        hint: "Make sure you send JSON with Content-Type: application/json",
      });
    }

    updates.push("modified_by = ?");
    values.push(req.user?.email || "anonymousUser");
    updates.push("modified_date = NOW()");
    values.push(orgId);

    const [result] = await db.query(
      `UPDATE organization SET ${updates.join(", ")} WHERE organization_id = ?`,
      values,
    );

    if (!result || result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          message: "Organization not found (no rows updated)",
          organization_id: orgId,
        });
    }

    const [rows] = await db.query(
      `SELECT * FROM organization WHERE organization_id = ? LIMIT 1`,
      [orgId],
    );

    return res.json({
      message: "Organization updated successfully",
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
      organization: rows[0] || null,
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

async function deleteOrganization(req, res) {
  try {
    const orgId = req.params.id;
    await db.query(
      `UPDATE organization SET
                status = 'INACTIVE',
                modified_by = ?,    
                modified_date = NOW()
            WHERE organization_id = ?`,
      [req.user.email, orgId],
    );
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

module.exports = {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
};
