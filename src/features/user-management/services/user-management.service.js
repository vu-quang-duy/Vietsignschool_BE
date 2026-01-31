/**
 * User Management Service
 * Sử dụng organization_manager table cho quan hệ user-organization
 */

const db = require('../../../db');
const {
  UserRole,
  UserStatus,
  isValidRole,
  isValidStatus,
  isValidGrade,
  isValidGender,
  getRoleLabel
} = require('../constants/user.constants');

// Mapping từ UserRole sang role_in_org trong organization_manager
const ROLE_TO_ORG_ROLE = {
  'ADMIN': 'SUPER_ADMIN',
  'FACILITY_MANAGER': 'CENTER_ADMIN',
  'TEACHER': 'TEACHER',
  'STUDENT': 'STUDENT',
  'USER': 'USER',
  'TESTER': 'USER',
};

// =====================================================
// USER MANAGEMENT - Sử dụng organization_manager
// =====================================================

/**
 * Tạo người dùng mới
 * Sử dụng organization_manager thay vì user.organization_id
 */
async function createUser(payload, createdBy) {
  const {
    name,
    email,
    password,
    phone,
    gender,
    birthDay,
    address,
    avatar,
    role,        // ADMIN, FACILITY_MANAGER, TEACHER, STUDENT, USER, TESTER
    facilityId,  // ID tổ chức - sẽ lưu vào organization_manager
    roleInOrg,   // Role trong tổ chức (optional, auto-map từ role)
    status,      // active, inactive
    grade,       // Lớp 1-5 (chỉ cho học sinh)
  } = payload || {};

  // Validate required fields
  if (!name || !email) {
    const err = new Error('Thiếu thông tin bắt buộc: name, email');
    err.status = 400;
    throw err;
  }

  // Validate role
  const userRole = role || UserRole.USER;
  if (!isValidRole(userRole)) {
    const err = new Error(`Vai trò không hợp lệ. Các vai trò: ${Object.values(UserRole).join(', ')}`);
    err.status = 400;
    throw err;
  }

  // Validate status
  const userStatus = status || UserStatus.ACTIVE;
  if (!isValidStatus(userStatus)) {
    const err = new Error(`Trạng thái không hợp lệ: active, inactive`);
    err.status = 400;
    throw err;
  }

  // Validate grade (chỉ cho học sinh)
  let studentGrade = null;
  if (userRole === UserRole.STUDENT && grade) {
    if (!isValidGrade(grade)) {
      const err = new Error('Lớp không hợp lệ. Học sinh phải thuộc lớp 1-5');
      err.status = 400;
      throw err;
    }
    studentGrade = Number(grade);
  }

  // Check organization exists
  if (facilityId) {
    const [org] = await db.query(
      'SELECT organization_id FROM organization WHERE organization_id = ? LIMIT 1',
      [facilityId]
    );
    if (org.length === 0) {
      const err = new Error('Tổ chức không tồn tại');
      err.status = 404;
      throw err;
    }
  }

  // Check email exists
  const [exists] = await db.query(
    'SELECT user_id FROM `user` WHERE email = ? LIMIT 1',
    [email]
  );
  if (exists.length > 0) {
    const err = new Error('Email đã tồn tại trong hệ thống');
    err.status = 409;
    throw err;
  }

  // Default password
  const userPassword = password || phone || '123456';

  // Insert user (KHÔNG có organization_id - dùng organization_manager)
  const [result] = await db.query(
    `INSERT INTO \`user\` (
      name, email, password, phone_number, gender, birth_day,
      address, avatar_location, code, status, grade,
      is_deleted, created_by, created_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())`,
    [
      name, email, userPassword, phone || null, gender || null, birthDay || null,
      address || null, avatar || null, userRole, userStatus, studentGrade,
      createdBy || 'system'
    ]
  );

  const userId = result.insertId;

  // Nếu có facilityId, tạo record trong organization_manager
  if (facilityId) {
    const orgRole = roleInOrg || ROLE_TO_ORG_ROLE[userRole] || 'USER';
    await db.query(
      `INSERT INTO organization_manager (
        organization_id, user_id, role_in_org, is_primary, assigned_date, assigned_by
      ) VALUES (?, ?, ?, 1, NOW(), ?)`,
      [facilityId, userId, orgRole, createdBy || null]
    );
  }

  const user = await getUserById(userId);

  return { message: 'Tạo người dùng thành công', user };
}

/**
 * Lấy danh sách người dùng
 * Sử dụng organization_manager để lấy thông tin tổ chức chính (is_primary = 1)
 */
async function getUsers({ page = 1, limit = 20, q = '', role, status, facilityId, grade } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const where = ['u.is_deleted = 0'];
  const params = [];

  if (q) {
    where.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  if (role) {
    where.push('u.code = ?');
    params.push(role);
  }

  if (status) {
    where.push('u.status = ?');
    params.push(status);
  }

  // Filter theo facilityId qua organization_manager
  if (facilityId) {
    where.push('om.organization_id = ?');
    params.push(facilityId);
  }

  if (grade) {
    where.push('u.grade = ?');
    params.push(Number(grade));
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  // JOIN với organization_manager (is_primary = 1 cho tổ chức chính)
  const [rows] = await db.query(
    `SELECT
      u.user_id AS id,
      u.name,
      u.email,
      u.code AS role,
      u.status,
      u.avatar_location AS avatar,
      u.phone_number AS phone,
      u.created_date AS createdAt,
      om.organization_id AS facilityId,
      om.role_in_org AS roleInOrg,
      u.grade,
      u.gender,
      u.birth_day AS birthDay,
      u.address,
      o.name AS facility_name,
      o.type AS facility_type
    FROM \`user\` u
    LEFT JOIN organization_manager om ON u.user_id = om.user_id AND om.is_primary = 1
    LEFT JOIN organization o ON om.organization_id = o.organization_id
    ${whereSql}
    ORDER BY u.user_id DESC
    LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  // Count query cũng cần JOIN với organization_manager nếu filter theo facilityId
  let countSql = `SELECT COUNT(DISTINCT u.user_id) as total FROM \`user\` u`;
  if (facilityId) {
    countSql += ` LEFT JOIN organization_manager om ON u.user_id = om.user_id AND om.is_primary = 1`;
  }
  countSql += ` ${whereSql}`;

  const [[{ total }]] = await db.query(countSql, params);

  return {
    users: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(Number(total) / Number(limit))
    }
  };
}

/**
 * Lấy thông tin người dùng theo ID
 * JOIN với organization_manager để lấy tổ chức chính
 */
async function getUserById(userId) {
  const [rows] = await db.query(
    `SELECT
      u.user_id AS id,
      u.name,
      u.email,
      u.code AS role,
      u.status,
      u.avatar_location AS avatar,
      u.phone_number AS phone,
      u.created_date AS createdAt,
      om.organization_id AS facilityId,
      om.role_in_org AS roleInOrg,
      om.is_primary AS isPrimaryOrg,
      u.grade,
      u.gender,
      u.birth_day AS birthDay,
      u.address,
      o.name AS facility_name,
      o.status AS facility_status,
      o.type AS facility_type
    FROM \`user\` u
    LEFT JOIN organization_manager om ON u.user_id = om.user_id AND om.is_primary = 1
    LEFT JOIN organization o ON om.organization_id = o.organization_id
    WHERE u.user_id = ? AND u.is_deleted = 0
    LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    const err = new Error('Người dùng không tồn tại');
    err.status = 404;
    throw err;
  }

  const user = rows[0];

  // Lấy tất cả tổ chức của user (nếu thuộc nhiều tổ chức)
  const [orgs] = await db.query(
    `SELECT
      om.organization_id AS id,
      o.name,
      o.type,
      om.role_in_org AS roleInOrg,
      om.is_primary AS isPrimary
    FROM organization_manager om
    JOIN organization o ON om.organization_id = o.organization_id
    WHERE om.user_id = ?
    ORDER BY om.is_primary DESC, o.name`,
    [userId]
  );
  user.organizations = orgs;

  return user;
}

/**
 * Cập nhật thông tin người dùng
 * facilityId và roleInOrg sẽ cập nhật qua organization_manager
 */
async function updateUser(userId, payload, modifiedBy) {
  const { name, email, phone, gender, birthDay, address, avatar, role, facilityId, roleInOrg, status, grade } = payload || {};

  const [existing] = await db.query(
    'SELECT user_id, code FROM `user` WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
    [userId]
  );
  if (existing.length === 0) {
    const err = new Error('Người dùng không tồn tại');
    err.status = 404;
    throw err;
  }

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (email !== undefined) { updates.push('email = ?'); values.push(email); }
  if (phone !== undefined) { updates.push('phone_number = ?'); values.push(phone); }
  if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
  if (birthDay !== undefined) { updates.push('birth_day = ?'); values.push(birthDay); }
  if (address !== undefined) { updates.push('address = ?'); values.push(address); }
  if (avatar !== undefined) { updates.push('avatar_location = ?'); values.push(avatar); }

  let newRole = role;
  if (role !== undefined) {
    if (!isValidRole(role)) {
      const err = new Error('Vai trò không hợp lệ');
      err.status = 400;
      throw err;
    }
    updates.push('code = ?');
    values.push(role);
    newRole = role;
  } else {
    newRole = existing[0].code;
  }

  if (status !== undefined) {
    if (!isValidStatus(status)) {
      const err = new Error('Trạng thái không hợp lệ');
      err.status = 400;
      throw err;
    }
    updates.push('status = ?');
    values.push(status);
  }

  if (grade !== undefined) {
    if (grade !== null && !isValidGrade(grade)) {
      const err = new Error('Lớp không hợp lệ (1-5)');
      err.status = 400;
      throw err;
    }
    updates.push('grade = ?');
    values.push(grade ? Number(grade) : null);
  }

  // Update user table nếu có thay đổi
  if (updates.length > 0) {
    updates.push('modified_by = ?', 'modified_date = NOW()');
    values.push(modifiedBy || 'system', userId);

    await db.query(
      `UPDATE \`user\` SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
  }

  // Xử lý cập nhật organization qua organization_manager
  if (facilityId !== undefined) {
    // Kiểm tra tổ chức tồn tại
    if (facilityId !== null) {
      const [org] = await db.query(
        'SELECT organization_id FROM organization WHERE organization_id = ? LIMIT 1',
        [facilityId]
      );
      if (org.length === 0) {
        const err = new Error('Tổ chức không tồn tại');
        err.status = 404;
        throw err;
      }
    }

    // Lấy tổ chức chính hiện tại
    const [currentOrg] = await db.query(
      'SELECT id, organization_id FROM organization_manager WHERE user_id = ? AND is_primary = 1 LIMIT 1',
      [userId]
    );

    if (facilityId === null) {
      // Xóa tổ chức chính nếu facilityId = null
      if (currentOrg.length > 0) {
        await db.query('DELETE FROM organization_manager WHERE id = ?', [currentOrg[0].id]);
      }
    } else if (currentOrg.length === 0) {
      // Chưa có tổ chức chính -> tạo mới
      const orgRole = roleInOrg || ROLE_TO_ORG_ROLE[newRole] || 'USER';
      await db.query(
        `INSERT INTO organization_manager (organization_id, user_id, role_in_org, is_primary, assigned_date, assigned_by)
         VALUES (?, ?, ?, 1, NOW(), ?)`,
        [facilityId, userId, orgRole, modifiedBy || null]
      );
    } else if (currentOrg[0].organization_id !== facilityId) {
      // Đổi tổ chức chính
      const orgRole = roleInOrg || ROLE_TO_ORG_ROLE[newRole] || 'USER';
      await db.query(
        `UPDATE organization_manager SET organization_id = ?, role_in_org = ?, modified_date = NOW()
         WHERE id = ?`,
        [facilityId, orgRole, currentOrg[0].id]
      );
    } else if (roleInOrg) {
      // Chỉ cập nhật role_in_org
      await db.query(
        `UPDATE organization_manager SET role_in_org = ?, modified_date = NOW() WHERE id = ?`,
        [roleInOrg, currentOrg[0].id]
      );
    }
  } else if (roleInOrg) {
    // Chỉ cập nhật role_in_org trong tổ chức chính hiện tại
    await db.query(
      `UPDATE organization_manager SET role_in_org = ?, modified_date = NOW()
       WHERE user_id = ? AND is_primary = 1`,
      [roleInOrg, userId]
    );
  }

  return await getUserById(userId);
}

/**
 * Xóa người dùng (soft delete)
 */
async function deleteUser(userId, modifiedBy) {
  const [result] = await db.query(
    `UPDATE \`user\` SET is_deleted = 1, modified_by = ?, modified_date = NOW() WHERE user_id = ?`,
    [modifiedBy || 'system', userId]
  );

  if (!result || result.affectedRows === 0) {
    const err = new Error('Người dùng không tồn tại');
    err.status = 404;
    throw err;
  }

  return { message: 'Xóa người dùng thành công' };
}

/**
 * Cập nhật trạng thái người dùng
 */
async function updateUserStatus(userId, status, modifiedBy) {
  if (!isValidStatus(status)) {
    const err = new Error('Trạng thái không hợp lệ');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    `UPDATE \`user\` SET status = ?, modified_by = ?, modified_date = NOW()
     WHERE user_id = ? AND is_deleted = 0`,
    [status, modifiedBy || 'system', userId]
  );

  if (!result || result.affectedRows === 0) {
    const err = new Error('Người dùng không tồn tại');
    err.status = 404;
    throw err;
  }

  return { message: 'Cập nhật trạng thái thành công', status };
}

/**
 * Lấy users theo organization (facility) qua organization_manager
 */
async function getUsersByFacility(facilityId) {
  const [rows] = await db.query(
    `SELECT
      u.user_id AS id,
      u.name,
      u.email,
      u.code AS role,
      u.status,
      u.avatar_location AS avatar,
      u.phone_number AS phone,
      om.organization_id AS facilityId,
      om.role_in_org AS roleInOrg,
      om.is_primary AS isPrimary
    FROM organization_manager om
    JOIN \`user\` u ON om.user_id = u.user_id
    WHERE om.organization_id = ? AND u.is_deleted = 0
    ORDER BY u.code, u.name`,
    [facilityId]
  );
  return rows;
}

/**
 * Lấy users theo role
 */
async function getUsersByRole(role) {
  const [rows] = await db.query(
    `SELECT
      u.user_id AS id,
      u.name,
      u.email,
      u.code AS role,
      u.status,
      u.avatar_location AS avatar,
      u.phone_number AS phone,
      u.organization_id AS facilityId
    FROM \`user\` u
    WHERE u.code = ? AND u.is_deleted = 0
    ORDER BY u.name`,
    [role]
  );
  return rows;
}

/**
 * Lấy facility managers 
 */
async function getFacilityManagers() {
  return await getUsersByRole(UserRole.FACILITY_MANAGER);
}

// =====================================================
// ORGANIZATION MANAGEMENT
// Theo actual DB schema: organization table
// Status: UPPERCASE (ACTIVE, INACTIVE)
// =====================================================

/**
 * Lấy danh sách tổ chức
 * @param {Object} options - { status, type, city, q, page, limit, parentId }
 */
async function getOrganizations({ status, type, city, q, page = 1, limit = 50, parentId } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const where = ['1=1'];
  const params = [];

  if (status) {
    where.push('o.status = ?');
    params.push(status.toUpperCase()); // DB uses UPPERCASE
  }

  if (type) {
    where.push('o.type = ?');
    params.push(type);
  }

  if (city) {
    where.push('o.city = ?');
    params.push(city);
  }

  if (parentId) {
    where.push('o.parent_id = ?');
    params.push(parentId);
  }

  if (q) {
    where.push('(o.name LIKE ? OR o.email LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  // Đếm users qua organization_manager
  const [rows] = await db.query(
    `SELECT
      o.organization_id AS id,
      o.name,
      o.slug,
      o.type,
      o.parent_id AS parentId,
      o.address,
      o.city,
      o.ward,
      o.street,
      o.phone,
      o.email,
      o.status,
      o.is_manager AS isManager,
      o.assigned_by AS assignedBy,
      o.assigned_date AS assignedDate,
      o.modified_by AS modifiedBy,
      o.modified_date AS updatedAt,
      p.name AS parent_name,
      (SELECT COUNT(*) FROM organization_manager om JOIN \`user\` u ON om.user_id = u.user_id WHERE om.organization_id = o.organization_id AND om.role_in_org = 'STUDENT' AND u.is_deleted = 0) AS studentCount,
      (SELECT COUNT(*) FROM organization_manager om JOIN \`user\` u ON om.user_id = u.user_id WHERE om.organization_id = o.organization_id AND om.role_in_org = 'TEACHER' AND u.is_deleted = 0) AS teacherCount
    FROM organization o
    LEFT JOIN organization p ON o.parent_id = p.organization_id
    ${whereSql}
    ORDER BY o.name
    LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(1) as total FROM organization o ${whereSql}`,
    params
  );

  return {
    organizations: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(Number(total) / Number(limit))
    }
  };
}

/**
 * Lấy chi tiết tổ chức theo ID
 */
async function getOrganizationById(orgId) {
  const [rows] = await db.query(
    `SELECT
      o.organization_id AS id,
      o.name,
      o.slug,
      o.type,
      o.parent_id AS parentId,
      o.address,
      o.city,
      o.ward,
      o.street,
      o.phone,
      o.email,
      o.status,
      o.is_manager AS isManager,
      o.assigned_by AS assignedBy,
      o.assigned_date AS assignedDate,
      o.modified_by AS modifiedBy,
      o.modified_date AS updatedAt,
      p.name AS parent_name
    FROM organization o
    LEFT JOIN organization p ON o.parent_id = p.organization_id
    WHERE o.organization_id = ?
    LIMIT 1`,
    [orgId]
  );

  if (rows.length === 0) {
    const err = new Error('Tổ chức không tồn tại');
    err.status = 404;
    throw err;
  }

  const org = rows[0];

  // Get users in this organization
  const users = await getUsersByFacility(orgId);
  org.managers = users.filter(u => u.role === UserRole.FACILITY_MANAGER);
  org.teachers = users.filter(u => u.role === UserRole.TEACHER);
  org.students = users.filter(u => u.role === UserRole.STUDENT);
  org.studentCount = org.students.length;
  org.teacherCount = org.teachers.length;

  return org;
}

/**
 * Tạo tổ chức mới
 * @param {Object} payload - { name, slug, type, parentId, address, city, ward, street, phone, email, status }
 */
async function createOrganization(payload, createdBy) {
  const {
    name, slug, type, parentId, address, city, ward, street,
    phone, email, status, isManager, assignedBy
  } = payload || {};

  if (!name) {
    const err = new Error('Tên tổ chức là bắt buộc');
    err.status = 400;
    throw err;
  }

  if (!type) {
    const err = new Error('Loại tổ chức là bắt buộc (EDU_SYSTEM, CENTER, SCHOOL, DEPARTMENT, FACILITY)');
    err.status = 400;
    throw err;
  }

  // Status UPPERCASE 
  const orgStatus = status ? status.toUpperCase() : 'ACTIVE';
  if (!['ACTIVE', 'INACTIVE'].includes(orgStatus)) {
    const err = new Error('Trạng thái không hợp lệ: ACTIVE, INACTIVE');
    err.status = 400;
    throw err;
  }

  // Generate slug if not provided
  const orgSlug = slug || name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const [result] = await db.query(
    `INSERT INTO organization (
      name, slug, type, parent_id, address, city, ward, street,
      phone, email, status, is_manager, assigned_by, assigned_date, modified_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
    [
      name, orgSlug, type, parentId || null, address || null, city || null,
      ward || null, street || null, phone || null, email || null,
      orgStatus, isManager ? 1 : 0, assignedBy || null, createdBy || 'system'
    ]
  );

  return {
    message: 'Tạo tổ chức thành công',
    organization: await getOrganizationById(result.insertId)
  };
}

/**
 * Cập nhật tổ chức
 */
async function updateOrganization(orgId, payload, modifiedBy) {
  const {
    name, slug, type, parentId, address, city, ward, street,
    phone, email, status, isManager, assignedBy
  } = payload || {};

  const [existing] = await db.query(
    'SELECT organization_id FROM organization WHERE organization_id = ? LIMIT 1',
    [orgId]
  );
  if (existing.length === 0) {
    const err = new Error('Tổ chức không tồn tại');
    err.status = 404;
    throw err;
  }

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
  if (type !== undefined) { updates.push('type = ?'); values.push(type); }
  if (parentId !== undefined) { updates.push('parent_id = ?'); values.push(parentId); }
  if (address !== undefined) { updates.push('address = ?'); values.push(address); }
  if (city !== undefined) { updates.push('city = ?'); values.push(city); }
  if (ward !== undefined) { updates.push('ward = ?'); values.push(ward); }
  if (street !== undefined) { updates.push('street = ?'); values.push(street); }
  if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
  if (email !== undefined) { updates.push('email = ?'); values.push(email); }
  if (isManager !== undefined) { updates.push('is_manager = ?'); values.push(isManager ? 1 : 0); }
  if (assignedBy !== undefined) { updates.push('assigned_by = ?'); values.push(assignedBy); }

  if (status !== undefined) {
    const upperStatus = status.toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(upperStatus)) {
      const err = new Error('Trạng thái không hợp lệ: ACTIVE, INACTIVE');
      err.status = 400;
      throw err;
    }
    updates.push('status = ?');
    values.push(upperStatus);
  }

  if (updates.length === 0) {
    const err = new Error('Không có thông tin cần cập nhật');
    err.status = 400;
    throw err;
  }

  updates.push('modified_by = ?');
  values.push(modifiedBy || 'system', orgId);

  await db.query(
    `UPDATE organization SET ${updates.join(', ')} WHERE organization_id = ?`,
    values
  );

  return await getOrganizationById(orgId);
}

/**
 * Xóa tổ chức (hard delete - organization table không có is_deleted)
 * Kiểm tra qua organization_manager thay vì user.organization_id
 */
async function deleteOrganization(orgId) {
  // Check if organization has children
  const [children] = await db.query(
    'SELECT organization_id FROM organization WHERE parent_id = ? LIMIT 1',
    [orgId]
  );
  if (children.length > 0) {
    const err = new Error('Không thể xóa tổ chức có tổ chức con');
    err.status = 400;
    throw err;
  }

  // Check if organization has users qua organization_manager
  const [users] = await db.query(
    `SELECT om.user_id FROM organization_manager om
     JOIN \`user\` u ON om.user_id = u.user_id
     WHERE om.organization_id = ? AND u.is_deleted = 0 LIMIT 1`,
    [orgId]
  );
  if (users.length > 0) {
    const err = new Error('Không thể xóa tổ chức còn người dùng');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    'DELETE FROM organization WHERE organization_id = ?',
    [orgId]
  );

  if (!result || result.affectedRows === 0) {
    const err = new Error('Tổ chức không tồn tại');
    err.status = 404;
    throw err;
  }

  return { message: 'Xóa tổ chức thành công' };
}

/**
 * Lấy tổ chức theo thành phố
 */
async function getOrganizationsByCity(city) {
  const [rows] = await db.query(
    `SELECT
      organization_id AS id, name, type, status, address, city
    FROM organization
    WHERE city = ?
    ORDER BY name`,
    [city]
  );
  return rows;
}

/**
 * Lấy tổ chức theo loại (type)
 */
async function getOrganizationsByType(type) {
  const [rows] = await db.query(
    `SELECT
      organization_id AS id, name, type, status, address, city, phone, email
    FROM organization
    WHERE type = ?
    ORDER BY name`,
    [type]
  );
  return rows;
}

/**
 * Lấy tổ chức đang hoạt động
 */
async function getActiveOrganizations() {
  const [rows] = await db.query(
    `SELECT
      organization_id AS id, name, type, address, city, phone, email
    FROM organization
    WHERE status = 'ACTIVE'
    ORDER BY name`
  );
  return rows;
}

/**
 * Thống kê tổ chức
 * Sử dụng organization_manager để đếm users
 */
async function getOrganizationsStats() {
  const [[stats]] = await db.query(`
    SELECT
      COUNT(*) AS totalOrganizations,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS activeOrganizations,
      COUNT(DISTINCT city) AS cityCount,
      SUM(CASE WHEN type = 'SCHOOL' THEN 1 ELSE 0 END) AS schoolCount,
      SUM(CASE WHEN type = 'CENTER' THEN 1 ELSE 0 END) AS centerCount
    FROM organization
  `);

  // Đếm users qua organization_manager
  const [[userStats]] = await db.query(`
    SELECT
      SUM(CASE WHEN om.role_in_org = 'STUDENT' THEN 1 ELSE 0 END) AS totalStudents,
      SUM(CASE WHEN om.role_in_org = 'TEACHER' THEN 1 ELSE 0 END) AS totalTeachers
    FROM organization_manager om
    JOIN \`user\` u ON om.user_id = u.user_id
    WHERE u.is_deleted = 0
  `);

  return {
    ...stats,
    ...userStats,
    totalFacilities: stats.totalOrganizations,
    activeFacilities: stats.activeOrganizations
  };
}

// =====================================================
// ROLES & LOOKUP
// =====================================================

/**
 * Lấy danh sách vai trò 
 */
async function getRoles() {
  const [rows] = await db.query(
    'SELECT code AS value, name AS label, description FROM role ORDER BY code'
  );
  return rows;
}

/**
 * Thống kê người dùng
 * Sử dụng organization_manager khi filter theo facilityId
 */
async function getUserStatistics({ facilityId } = {}) {
  if (facilityId) {
    // Thống kê theo tổ chức qua organization_manager
    const [byRole] = await db.query(
      `SELECT u.code AS role, COUNT(DISTINCT u.user_id) AS count
       FROM organization_manager om
       JOIN \`user\` u ON om.user_id = u.user_id
       WHERE u.is_deleted = 0 AND om.organization_id = ?
       GROUP BY u.code`,
      [facilityId]
    );

    const [byStatus] = await db.query(
      `SELECT u.status, COUNT(DISTINCT u.user_id) AS count
       FROM organization_manager om
       JOIN \`user\` u ON om.user_id = u.user_id
       WHERE u.is_deleted = 0 AND om.organization_id = ?
       GROUP BY u.status`,
      [facilityId]
    );

    const [byGrade] = await db.query(
      `SELECT u.grade, COUNT(DISTINCT u.user_id) AS count
       FROM organization_manager om
       JOIN \`user\` u ON om.user_id = u.user_id
       WHERE u.is_deleted = 0 AND u.code = 'STUDENT' AND u.grade IS NOT NULL AND om.organization_id = ?
       GROUP BY u.grade ORDER BY u.grade`,
      [facilityId]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(DISTINCT u.user_id) AS total
       FROM organization_manager om
       JOIN \`user\` u ON om.user_id = u.user_id
       WHERE u.is_deleted = 0 AND om.organization_id = ?`,
      [facilityId]
    );

    return { total, byRole, byStatus, byGrade };
  }

  // Thống kê toàn bộ (không filter theo tổ chức)
  const [byRole] = await db.query(
    `SELECT code AS role, COUNT(*) AS count
     FROM \`user\` WHERE is_deleted = 0
     GROUP BY code`
  );

  const [byStatus] = await db.query(
    `SELECT status, COUNT(*) AS count
     FROM \`user\` WHERE is_deleted = 0
     GROUP BY status`
  );

  const [byGrade] = await db.query(
    `SELECT grade, COUNT(*) AS count
     FROM \`user\` WHERE is_deleted = 0 AND code = 'STUDENT' AND grade IS NOT NULL
     GROUP BY grade ORDER BY grade`
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM \`user\` WHERE is_deleted = 0`
  );

  return { total, byRole, byStatus, byGrade };
}

// =====================================================
// PROFILE & LEARNING TRACKING
// =====================================================

async function getProfile(userId) {
  return await getUserById(userId);
}

async function updateProfile(userId, payload) {
  return await updateUser(userId, payload, 'self');
}

async function viewLesson(userId, lessonId) {
  const [view] = await db.query(
    'SELECT * FROM lesson_view WHERE user_id = ? AND lesson_id = ? LIMIT 1',
    [userId, lessonId]
  );

  if (view.length === 0) {
    await db.query(
      'INSERT INTO lesson_view (user_id, lesson_id, view_count, last_viewed_at, created_date) VALUES (?, ?, 1, NOW(), NOW())',
      [userId, lessonId]
    );
  } else {
    await db.query(
      'UPDATE lesson_view SET view_count = view_count + 1, last_viewed_at = NOW() WHERE user_id = ? AND lesson_id = ?',
      [userId, lessonId]
    );
  }

  return { message: 'Đã ghi nhận xem bài học' };
}

async function viewVocabulary(userId, vocabularyId) {
  const [view] = await db.query(
    'SELECT * FROM vocabulary_view WHERE user_id = ? AND vocabulary_id = ? LIMIT 1',
    [userId, vocabularyId]
  );

  if (view.length === 0) {
    await db.query(
      'INSERT INTO vocabulary_view (user_id, vocabulary_id, view_count, last_viewed_at, created_date) VALUES (?, ?, 1, NOW(), NOW())',
      [userId, vocabularyId]
    );
  } else {
    await db.query(
      'UPDATE vocabulary_view SET view_count = view_count + 1, last_viewed_at = NOW() WHERE user_id = ? AND vocabulary_id = ?',
      [userId, vocabularyId]
    );
  }

  return { message: 'Đã ghi nhận xem từ vựng' };
}

async function getStudentLearningProgress(userId) {
  const [lessonViews] = await db.query(
    `SELECT lv.lesson_id, l.lesson_name, lv.view_count, lv.completed, lv.progress_percent, lv.last_viewed_at
     FROM lesson_view lv
     LEFT JOIN lesson l ON lv.lesson_id = l.lesson_id
     WHERE lv.user_id = ?
     ORDER BY lv.last_viewed_at DESC LIMIT 10`,
    [userId]
  );

  const [vocabViews] = await db.query(
    `SELECT vv.vocabulary_id, v.content, v.vocabulary_type, vv.view_count, vv.last_viewed_at
     FROM vocabulary_view vv
     LEFT JOIN vocabulary v ON vv.vocabulary_id = v.vocabulary_id
     WHERE vv.user_id = ?
     ORDER BY vv.last_viewed_at DESC LIMIT 10`,
    [userId]
  );

  return { lessonViews, vocabularyViews: vocabViews };
}

// =====================================================
// ORGANIZATION MANAGER - Quản lý quan hệ user-organization
// =====================================================

/**
 * Gán user vào tổ chức
 * @param {number} userId - ID user
 * @param {number} organizationId - ID tổ chức
 * @param {string} roleInOrg - Role trong tổ chức (SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, USER)
 * @param {boolean} isPrimary - Có phải tổ chức chính không
 * @param {number|string} assignedBy - Người gán
 */
async function assignUserToOrganization(userId, organizationId, roleInOrg, isPrimary = false, assignedBy = null) {
  // Kiểm tra user tồn tại
  const [user] = await db.query(
    'SELECT user_id FROM `user` WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
    [userId]
  );
  if (user.length === 0) {
    const err = new Error('Người dùng không tồn tại');
    err.status = 404;
    throw err;
  }

  // Kiểm tra tổ chức tồn tại
  const [org] = await db.query(
    'SELECT organization_id FROM organization WHERE organization_id = ? LIMIT 1',
    [organizationId]
  );
  if (org.length === 0) {
    const err = new Error('Tổ chức không tồn tại');
    err.status = 404;
    throw err;
  }

  // Kiểm tra đã có quan hệ chưa
  const [existing] = await db.query(
    'SELECT id FROM organization_manager WHERE organization_id = ? AND user_id = ? LIMIT 1',
    [organizationId, userId]
  );
  if (existing.length > 0) {
    const err = new Error('User đã thuộc tổ chức này');
    err.status = 409;
    throw err;
  }

  // Nếu isPrimary = true, bỏ is_primary của các record khác
  if (isPrimary) {
    await db.query(
      'UPDATE organization_manager SET is_primary = 0 WHERE user_id = ?',
      [userId]
    );
  }

  // Insert record mới
  const [result] = await db.query(
    `INSERT INTO organization_manager (organization_id, user_id, role_in_org, is_primary, assigned_date, assigned_by)
     VALUES (?, ?, ?, ?, NOW(), ?)`,
    [organizationId, userId, roleInOrg || 'USER', isPrimary ? 1 : 0, assignedBy || null]
  );

  return {
    message: 'Gán user vào tổ chức thành công',
    id: result.insertId
  };
}

/**
 * Xóa user khỏi tổ chức
 */
async function removeUserFromOrganization(userId, organizationId) {
  const [result] = await db.query(
    'DELETE FROM organization_manager WHERE user_id = ? AND organization_id = ?',
    [userId, organizationId]
  );

  if (!result || result.affectedRows === 0) {
    const err = new Error('Không tìm thấy quan hệ user-tổ chức');
    err.status = 404;
    throw err;
  }

  return { message: 'Đã xóa user khỏi tổ chức' };
}

/**
 * Cập nhật role của user trong tổ chức
 */
async function updateUserRoleInOrganization(userId, organizationId, roleInOrg, modifiedBy = null) {
  const [result] = await db.query(
    `UPDATE organization_manager SET role_in_org = ?, modified_date = NOW()
     WHERE user_id = ? AND organization_id = ?`,
    [roleInOrg, userId, organizationId]
  );

  if (!result || result.affectedRows === 0) {
    const err = new Error('Không tìm thấy quan hệ user-tổ chức');
    err.status = 404;
    throw err;
  }

  return { message: 'Cập nhật role thành công' };
}

/**
 * Đặt tổ chức chính cho user
 */
async function setPrimaryOrganization(userId, organizationId) {
  // Bỏ is_primary của tất cả tổ chức khác
  await db.query(
    'UPDATE organization_manager SET is_primary = 0 WHERE user_id = ?',
    [userId]
  );

  // Set is_primary cho tổ chức được chọn
  const [result] = await db.query(
    'UPDATE organization_manager SET is_primary = 1 WHERE user_id = ? AND organization_id = ?',
    [userId, organizationId]
  );

  if (!result || result.affectedRows === 0) {
    const err = new Error('Không tìm thấy quan hệ user-tổ chức');
    err.status = 404;
    throw err;
  }

  return { message: 'Đã đặt tổ chức chính' };
}

/**
 * Lấy danh sách tổ chức của user
 */
async function getUserOrganizations(userId) {
  const [rows] = await db.query(
    `SELECT
      om.id,
      om.organization_id AS organizationId,
      o.name AS organizationName,
      o.type AS organizationType,
      o.status AS organizationStatus,
      om.role_in_org AS roleInOrg,
      om.is_primary AS isPrimary,
      om.assigned_date AS assignedDate
    FROM organization_manager om
    JOIN organization o ON om.organization_id = o.organization_id
    WHERE om.user_id = ?
    ORDER BY om.is_primary DESC, o.name`,
    [userId]
  );
  return rows;
}

/**
 * Lấy danh sách users trong tổ chức (với filter role)
 */
async function getOrganizationUsers(organizationId, roleInOrg = null) {
  let query = `
    SELECT
      om.id,
      om.user_id AS userId,
      u.name,
      u.email,
      u.code AS userRole,
      u.status,
      u.avatar_location AS avatar,
      om.role_in_org AS roleInOrg,
      om.is_primary AS isPrimary,
      om.assigned_date AS assignedDate
    FROM organization_manager om
    JOIN \`user\` u ON om.user_id = u.user_id
    WHERE om.organization_id = ? AND u.is_deleted = 0
  `;
  const params = [organizationId];

  if (roleInOrg) {
    query += ' AND om.role_in_org = ?';
    params.push(roleInOrg);
  }

  query += ' ORDER BY om.role_in_org, u.name';

  const [rows] = await db.query(query, params);
  return rows;
}

module.exports = {
  // Users
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUsersByFacility,
  getUsersByRole,
  getFacilityManagers,
  // Organizations
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationsByCity,
  getOrganizationsByType,
  getActiveOrganizations,
  getOrganizationsStats,
  // Organization Manager (user-organization relationship)
  assignUserToOrganization,
  removeUserFromOrganization,
  updateUserRoleInOrganization,
  setPrimaryOrganization,
  getUserOrganizations,
  getOrganizationUsers,
  // Roles & Stats
  getRoles,
  getUserStatistics,
  // Profile & Learning
  getProfile,
  updateProfile,
  viewLesson,
  viewVocabulary,
  getStudentLearningProgress,
};
