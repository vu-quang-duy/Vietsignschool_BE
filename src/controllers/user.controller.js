const db = require('../db');
const bcrypt = require('bcrypt');

// GET user/profile

async function getProfile(req, res) {
    try {
        const userId = req.user?.user_id ;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const [rows] = await db.query(
            'SELECT user_id, name, email, phone_number, code, is_deleted, is_oauth2, created_by, created_date, modified_by, modified_date FROM `user` WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (rows.length === 0){
            return res.status(404).json({message: "User not found"});
        }

        const user = rows[0];
        return res.json({user});
    }
    catch (error){
        console.error('Error fetching user profile:', error);
        return res.status(500).json({message: "Internal server error", error: error.message});
    }
}

// Update user/profile
async function updateProfile(req, res){
    try {
        const userId = req.user?.user_id;
        if(!userId){
            return res.status(401).json({message: "Unauthorized"});
        }

        const {
            name,
            email,
            phone_number,
            gender,
            address,
            avatar_location,
            birth_day,
            code,
            school_id
        }
        = req.body;


        await db.query(
            `UPDATE user
            SET 
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                phone_number = COALESCE(?, phone_number),
                gender = COALESCE(?, gender),
                address = COALESCE(?, address),
                avatar_location = COALESCE(?, avatar_location),
                birth_day = COALESCE(?, birth_day),
                code = COALESCE(?, code),
                school_id = COALESCE(?, school_id),
                modified_by = ?,
                modified_date = NOW()
            WHERE user_id = ? AND is_deleted = 0`,
            [
                name || null,
                email || null,
                phone_number || null,
                gender || null,
                address || null,
                avatar_location || null,
                birth_day || null,
                code || null,
                school_id || null,
                req.user?.email || 'anonymousUser',
                userId
            ]
            );
        return  res.json({message:"Profile updated successfully: ", updatedProfile: req.body});

    } catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({message: "Internal server error", error: error.message});
    }
}

// PUT /user/change-password
async function changePassword(req, res) {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ message: 'Chưa đăng nhập' });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        // 1. Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại'
            });
        }

        // 2. Lấy mật khẩu hiện tại từ database
        const [userRows] = await db.query(
            'SELECT password FROM `user` WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const user = userRows[0];

        // 3. Kiểm tra mật khẩu hiện tại
        // const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        const isPasswordValid = currentPassword === user.password; // Plaintext comparison

        if (!isPasswordValid) {
            return res.status(400).json({
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // 4. Cập nhật mật khẩu mới
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        const passwordToSave = newPassword; // Plaintext for now

        await db.query(
            'UPDATE `user` SET password = ?, modified_by = ?, modified_date = NOW() WHERE user_id = ?',
            [passwordToSave, req.user?.email || 'system', userId]
        );

        return res.json({
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// DELETE /user/account
async function deleteAccount(req, res) {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ message: 'Chưa đăng nhập' });
        }

        const { password, confirmDelete } = req.body;

        // 1. Validate input
        if (!password) {
            return res.status(400).json({
                message: 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản'
            });
        }

        if (confirmDelete !== true) {
            return res.status(400).json({
                message: 'Vui lòng xác nhận bạn muốn xóa tài khoản'
            });
        }

        // 2. Kiểm tra mật khẩu
        const [userRows] = await db.query(
            'SELECT password, email FROM `user` WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const user = userRows[0];

        // const isPasswordValid = await bcrypt.compare(password, user.password);
        const isPasswordValid = password === user.password;

        if (!isPasswordValid) {
            return res.status(400).json({
                message: 'Mật khẩu không đúng'
            });
        }

        // 3. Soft delete - Đánh dấu is_deleted = 1
        await db.query(
            'UPDATE `user` SET is_deleted = 1, modified_by = ?, modified_date = NOW() WHERE user_id = ?',
            [user.email, userId]
        );

        return res.json({
            message: 'Xóa tài khoản thành công. Tài khoản của bạn đã bị vô hiệu hóa.'
        });

    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// GET /user/activity-log
async function getActivityLog(req, res) {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ message: 'Chưa đăng nhập' });
        }

        // Lấy thông tin các hoạt động gần đây từ bảng user
        const [userRows] = await db.query(
            `SELECT
                user_id,
                email,
                name,
                created_date as account_created,
                modified_date as last_modified,
                modified_by as last_modified_by,
                is_oauth2,
                code as role
            FROM \`user\`
            WHERE user_id = ? AND is_deleted = 0
            LIMIT 1`,
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const activityLog = {
            user_info: userRows[0],
            activity_summary: {
                account_created: userRows[0].account_created,
                last_login: 'Chức năng tracking login sẽ được thêm sau',
                last_profile_update: userRows[0].last_modified,
                last_modified_by: userRows[0].last_modified_by
            },
            note: 'Để có log chi tiết hơn, cần tạo bảng activity_logs riêng'
        };

        return res.json(activityLog);

    } catch (error) {
        console.error('Error fetching activity log:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// PUT /user/avatar (Upload file)
async function uploadAvatar(req, res) {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ message: 'Chưa đăng nhập' });
        }

        // Kiểm tra có file upload không
        if (!req.file) {
            return res.status(400).json({
                message: 'Vui lòng chọn file ảnh để upload'
            });
        }

        // Tạo đường dẫn URL cho file
        const avatar_location = `/uploads/avatars/${req.file.filename}`;

        // Cập nhật avatar location vào database
        await db.query(
            'UPDATE `user` SET avatar_location = ?, modified_by = ?, modified_date = NOW() WHERE user_id = ? AND is_deleted = 0',
            [avatar_location, req.user?.email || 'system', userId]
        );

        return res.json({
            message: 'Upload avatar thành công',
            avatar_location,
            file_info: {
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });

    } catch (error) {
        console.error('Error uploading avatar:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// PUT /user/avatar (Cập nhật bằng URL - cho trường hợp dùng Cloudinary, S3, etc.)
async function updateAvatarUrl(req, res) {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ message: 'Chưa đăng nhập' });
        }

        const { avatar_location } = req.body;

        if (!avatar_location) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp đường dẫn avatar'
            });
        }

        // Cập nhật avatar
        await db.query(
            'UPDATE `user` SET avatar_location = ?, modified_by = ?, modified_date = NOW() WHERE user_id = ? AND is_deleted = 0',
            [avatar_location, req.user?.email || 'system', userId]
        );

        return res.json({
            message: 'Cập nhật avatar thành công',
            avatar_location
        });

    } catch (error) {
        console.error('Error updating avatar:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// ==================== ADMIN FUNCTIONS ====================

// GET /users - Lấy danh sách tất cả user (Admin only)
async function getAllUsers(req, res) {
    try {
        const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT
                u.user_id,
                u.name,
                u.email,
                u.phone_number,
                u.gender,
                u.address,
                u.avatar_location,
                u.birth_day,
                u.code as role,
                r.name as role_name,
                u.school_id,
                u.is_deleted,
                u.is_oauth2,
                u.created_by,
                u.created_date,
                u.modified_by,
                u.modified_date
            FROM \`user\` u
            LEFT JOIN \`role\` r ON u.code = r.code
            WHERE 1=1
        `;

        const params = [];

        // Filter by search (name or email)
        if (search) {
            query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Filter by role
        if (role) {
            query += ' AND u.code = ?';
            params.push(role);
        }

        // Filter by status (active/deleted)
        if (status === 'active') {
            query += ' AND u.is_deleted = 0';
        } else if (status === 'deleted') {
            query += ' AND u.is_deleted = 1';
        }

        // Get total count
        const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0].total;

        // Add pagination
        query += ' ORDER BY u.created_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await db.query(query, params);

        return res.json({
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            users
        });

    } catch (error) {
        console.error('Error getting all users:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// GET /users/:userId - Lấy thông tin user theo ID (Admin only)
async function getUserById(req, res) {
    try {
        const { userId } = req.params;

        const [users] = await db.query(
            `SELECT
                u.user_id,
                u.name,
                u.email,
                u.phone_number,
                u.gender,
                u.address,
                u.avatar_location,
                u.birth_day,
                u.code as role,
                r.name as role_name,
                u.school_id,
                u.is_deleted,
                u.is_oauth2,
                u.created_by,
                u.created_date,
                u.modified_by,
                u.modified_date
            FROM \`user\` u
            LEFT JOIN \`role\` r ON u.code = r.code
            WHERE u.user_id = ?
            LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        return res.json({
            user: users[0]
        });

    } catch (error) {
        console.error('Error getting user by ID:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// POST /users - Tạo user mới (Admin only)
async function createUser(req, res) {
    try {
        const {
            name,
            email,
            password,
            phone_number,
            gender,
            address,
            birth_day,
            role, // ADMIN, TEACHER, STUDENT
            school_id
        } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ tên, email và mật khẩu'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Email không hợp lệ'
            });
        }

        // Check if email already exists
        const [existingUsers] = await db.query(
            'SELECT user_id FROM `user` WHERE email = ? LIMIT 1',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: 'Email đã được sử dụng'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Validate role
        const validRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
        const userRole = role || 'STUDENT';
        if (!validRoles.includes(userRole)) {
            return res.status(400).json({
                message: 'Role không hợp lệ. Phải là ADMIN, TEACHER hoặc STUDENT'
            });
        }

        // Insert new user
        const [result] = await db.query(
            `INSERT INTO \`user\`
            (name, email, password, phone_number, gender, address, birth_day, code, school_id, created_by, created_date, is_deleted, is_oauth2)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0)`,
            [
                name,
                email,
                password, // TODO: Should be hashed with bcrypt
                phone_number || null,
                gender || null,
                address || null,
                birth_day || null,
                userRole,
                school_id || null,
                req.user?.email || 'system'
            ]
        );

        return res.status(201).json({
            message: 'Tạo người dùng thành công',
            user: {
                user_id: result.insertId,
                name,
                email,
                role: userRole
            }
        });

    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// PUT /users/:userId - Cập nhật thông tin user (Admin only)
async function updateUser(req, res) {
    try {
        const { userId } = req.params;
        const {
            name,
            email,
            phone_number,
            gender,
            address,
            avatar_location,
            birth_day,
            role,
            school_id,
            is_deleted
        } = req.body;

        // Check if user exists
        const [existingUsers] = await db.query(
            'SELECT user_id FROM `user` WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // If email is being updated, check for duplicates
        if (email) {
            const [duplicateEmail] = await db.query(
                'SELECT user_id FROM `user` WHERE email = ? AND user_id != ? LIMIT 1',
                [email, userId]
            );

            if (duplicateEmail.length > 0) {
                return res.status(400).json({
                    message: 'Email đã được sử dụng bởi người dùng khác'
                });
            }
        }

        // Validate role if provided
        if (role) {
            const validRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    message: 'Role không hợp lệ. Phải là ADMIN, TEACHER hoặc STUDENT'
                });
            }
        }

        // Update user
        await db.query(
            `UPDATE \`user\`
            SET
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                phone_number = COALESCE(?, phone_number),
                gender = COALESCE(?, gender),
                address = COALESCE(?, address),
                avatar_location = COALESCE(?, avatar_location),
                birth_day = COALESCE(?, birth_day),
                code = COALESCE(?, code),
                school_id = COALESCE(?, school_id),
                is_deleted = COALESCE(?, is_deleted),
                modified_by = ?,
                modified_date = NOW()
            WHERE user_id = ?`,
            [
                name || null,
                email || null,
                phone_number || null,
                gender || null,
                address || null,
                avatar_location || null,
                birth_day || null,
                role || null,
                school_id || null,
                is_deleted !== undefined ? is_deleted : null,
                req.user?.email || 'system',
                userId
            ]
        );

        return res.json({
            message: 'Cập nhật người dùng thành công',
            user_id: userId
        });

    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// DELETE /users/:userId - Xóa user (Soft delete) (Admin only)
async function deleteUser(req, res) {
    try {
        const { userId } = req.params;

        // Check if user exists
        const [users] = await db.query(
            'SELECT user_id, email, is_deleted FROM `user` WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const user = users[0];

        if (user.is_deleted === 1) {
            return res.status(400).json({
                message: 'Người dùng đã bị xóa trước đó'
            });
        }

        // Soft delete
        await db.query(
            'UPDATE `user` SET is_deleted = 1, modified_by = ?, modified_date = NOW() WHERE user_id = ?',
            [req.user?.email || 'system', userId]
        );

        return res.json({
            message: 'Xóa người dùng thành công',
            user_id: userId
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// PUT /users/:userId/restore - Khôi phục user đã xóa (Admin only)
async function restoreUser(req, res) {
    try {
        const { userId } = req.params;

        // Check if user exists and is deleted
        const [users] = await db.query(
            'SELECT user_id, is_deleted FROM `user` WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (users[0].is_deleted === 0) {
            return res.status(400).json({
                message: 'Người dùng chưa bị xóa'
            });
        }

        // Restore user
        await db.query(
            'UPDATE `user` SET is_deleted = 0, modified_by = ?, modified_date = NOW() WHERE user_id = ?',
            [req.user?.email || 'system', userId]
        );

        return res.json({
            message: 'Khôi phục người dùng thành công',
            user_id: userId
        });

    } catch (error) {
        console.error('Error restoring user:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// PUT /users/:userId/reset-password - Reset mật khẩu user (Admin only)
async function resetUserPassword(req, res) {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        // Validate
        if (!newPassword) {
            return res.status(400).json({
                message: 'Vui lòng nhập mật khẩu mới'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Check if user exists
        const [users] = await db.query(
            'SELECT user_id, email FROM `user` WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Update password
        await db.query(
            'UPDATE `user` SET password = ?, modified_by = ?, modified_date = NOW() WHERE user_id = ?',
            [newPassword, req.user?.email || 'system', userId]
        );

        return res.json({
            message: 'Reset mật khẩu thành công',
            user_id: userId
        });

    } catch (error) {
        console.error('Error resetting user password:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// PUT /users/:userId/change-role - Thay đổi role của user (Admin only)
async function changeUserRole(req, res) {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({
                message: 'Role không hợp lệ. Phải là ADMIN, TEACHER hoặc STUDENT'
            });
        }

        // Check if user exists
        const [users] = await db.query(
            'SELECT user_id, code as current_role FROM `user` WHERE user_id = ? AND is_deleted = 0 LIMIT 1',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (users[0].current_role === role) {
            return res.status(400).json({
                message: `Người dùng đã có role ${role}`
            });
        }

        // Update role
        await db.query(
            'UPDATE `user` SET code = ?, modified_by = ?, modified_date = NOW() WHERE user_id = ?',
            [role, req.user?.email || 'system', userId]
        );

        return res.json({
            message: 'Thay đổi role thành công',
            user_id: userId,
            old_role: users[0].current_role,
            new_role: role
        });

    } catch (error) {
        console.error('Error changing user role:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// ==================== ACCOUNT APPROVAL FUNCTIONS ====================

// GET /users/pending - Lấy danh sách tài khoản chờ phê duyệt (Admin only)
async function getPendingUsers(req, res) {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get total count
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total
             FROM \`user\`
             WHERE approval_status = 'PENDING' AND is_deleted = 0`
        );
        const total = countResult[0].total;

        // Get pending users
        const [users] = await db.query(
            `SELECT
                u.user_id, u.name, u.email, u.phone_number,
                u.code as role, r.name as role_name,
                u.approval_status, u.created_date, u.created_by
            FROM \`user\` u
            LEFT JOIN \`role\` r ON u.code = r.code
            WHERE u.approval_status = 'PENDING' AND u.is_deleted = 0
            ORDER BY u.created_date ASC
            LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );

        return res.json({
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            users
        });

    } catch (error) {
        console.error('Error getting pending users:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// GET /users/approval-stats - Thống kê tài khoản theo trạng thái phê duyệt (Admin only)
async function getApprovalStats(req, res) {
    try {
        const [stats] = await db.query(
            `SELECT
                approval_status,
                COUNT(*) as total
            FROM \`user\`
            WHERE is_deleted = 0
            GROUP BY approval_status`
        );

        // Format statistics
        const statistics = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0
        };

        stats.forEach(stat => {
            const status = stat.approval_status.toLowerCase();
            statistics[status] = stat.total;
            statistics.total += stat.total;
        });

        return res.json(statistics);

    } catch (error) {
        console.error('Error getting approval stats:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// PUT /users/:userId/approve - Phê duyệt tài khoản (Admin only)
async function approveUser(req, res) {
    try {
        const { userId } = req.params;

        // Check if user exists and is pending
        const [users] = await db.query(
            `SELECT user_id, name, email, approval_status
             FROM \`user\`
             WHERE user_id = ? AND is_deleted = 0
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng'
            });
        }

        const user = users[0];

        // Check if already approved
        if (user.approval_status === 'APPROVED') {
            return res.status(400).json({
                message: 'Tài khoản đã được phê duyệt trước đó'
            });
        }

        // Approve user
        await db.query(
            `UPDATE \`user\`
             SET approval_status = 'APPROVED',
                 approved_by = ?,
                 approved_date = NOW(),
                 rejection_reason = NULL,
                 modified_by = ?,
                 modified_date = NOW()
             WHERE user_id = ?`,
            [req.user?.email || 'system', req.user?.email || 'system', userId]
        );

        return res.json({
            message: 'Phê duyệt tài khoản thành công',
            user_id: parseInt(userId),
            user_name: user.name,
            user_email: user.email,
            approved_by: req.user?.email || 'system',
            approved_date: new Date()
        });

    } catch (error) {
        console.error('Error approving user:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// PUT /users/:userId/reject - Từ chối tài khoản (Admin only)
async function rejectUser(req, res) {
    try {
        const { userId } = req.params;
        const { rejection_reason } = req.body;

        // Validate rejection reason
        if (!rejection_reason || rejection_reason.trim() === '') {
            return res.status(400).json({
                message: 'Vui lòng nhập lý do từ chối'
            });
        }

        // Check if user exists
        const [users] = await db.query(
            `SELECT user_id, name, email, approval_status
             FROM \`user\`
             WHERE user_id = ? AND is_deleted = 0
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng'
            });
        }

        const user = users[0];

        // Reject user
        await db.query(
            `UPDATE \`user\`
             SET approval_status = 'REJECTED',
                 approved_by = ?,
                 approved_date = NOW(),
                 rejection_reason = ?,
                 modified_by = ?,
                 modified_date = NOW()
             WHERE user_id = ?`,
            [req.user?.email || 'system', rejection_reason, req.user?.email || 'system', userId]
        );

        return res.json({
            message: 'Từ chối tài khoản thành công',
            user_id: parseInt(userId),
            user_name: user.name,
            user_email: user.email,
            rejected_by: req.user?.email || 'system',
            rejected_date: new Date(),
            rejection_reason
        });

    } catch (error) {
        console.error('Error rejecting user:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// POST /users/bulk-approve - Phê duyệt nhiều tài khoản cùng lúc (Admin only)
async function bulkApproveUsers(req, res) {
    try {
        const { user_ids } = req.body;

        // Validate input
        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp danh sách user_ids (array)'
            });
        }

        // Limit to 50 users at a time
        if (user_ids.length > 50) {
            return res.status(400).json({
                message: 'Chỉ được phê duyệt tối đa 50 tài khoản cùng lúc'
            });
        }

        // Check which users exist and are pending
        const placeholders = user_ids.map(() => '?').join(',');
        const [users] = await db.query(
            `SELECT user_id, name, email, approval_status
             FROM \`user\`
             WHERE user_id IN (${placeholders})
               AND is_deleted = 0`,
            user_ids
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng nào trong danh sách'
            });
        }

        // Filter only pending users
        const pendingUsers = users.filter(u => u.approval_status === 'PENDING');
        const alreadyApprovedUsers = users.filter(u => u.approval_status === 'APPROVED');

        if (pendingUsers.length === 0) {
            return res.status(400).json({
                message: 'Tất cả tài khoản trong danh sách đã được phê duyệt',
                already_approved: alreadyApprovedUsers.length
            });
        }

        // Bulk approve pending users
        const pendingUserIds = pendingUsers.map(u => u.user_id);
        const pendingPlaceholders = pendingUserIds.map(() => '?').join(',');

        await db.query(
            `UPDATE \`user\`
             SET approval_status = 'APPROVED',
                 approved_by = ?,
                 approved_date = NOW(),
                 rejection_reason = NULL,
                 modified_by = ?,
                 modified_date = NOW()
             WHERE user_id IN (${pendingPlaceholders})`,
            [req.user?.email || 'system', req.user?.email || 'system', ...pendingUserIds]
        );

        return res.json({
            message: 'Phê duyệt hàng loạt thành công',
            total_requested: user_ids.length,
            approved_count: pendingUsers.length,
            already_approved_count: alreadyApprovedUsers.length,
            approved_users: pendingUsers.map(u => ({
                user_id: u.user_id,
                name: u.name,
                email: u.email
            }))
        });

    } catch (error) {
        console.error('Error bulk approving users:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

// GET /users/:userId/approval-history - Xem lịch sử phê duyệt của user (Admin only)
async function getUserApprovalHistory(req, res) {
    try {
        const { userId } = req.params;

        // Get user approval info
        const [users] = await db.query(
            `SELECT
                user_id, name, email,
                approval_status,
                approved_by,
                approved_date,
                rejection_reason,
                created_by,
                created_date
            FROM \`user\`
            WHERE user_id = ? AND is_deleted = 0
            LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy người dùng'
            });
        }

        const user = users[0];

        // Format history
        const history = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            current_status: user.approval_status,
            created_by: user.created_by,
            created_date: user.created_date,
            approval_info: null
        };

        if (user.approval_status !== 'PENDING') {
            history.approval_info = {
                status: user.approval_status,
                processed_by: user.approved_by,
                processed_date: user.approved_date,
                rejection_reason: user.rejection_reason
            };
        }

        return res.json(history);

    } catch (error) {
        console.error('Error getting user approval history:', error);
        return res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
}

module.exports = {
    // User's own profile functions
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    getActivityLog,
    uploadAvatar,
    updateAvatarUrl,

    // Admin functions for user management
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    restoreUser,
    resetUserPassword,
    changeUserRole,

    // Account approval functions
    getPendingUsers,
    getApprovalStats,
    approveUser,
    rejectUser,
    bulkApproveUsers,
    getUserApprovalHistory
 };