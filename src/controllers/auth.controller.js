const jwt = require('jsonwebtoken');
const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../services/email.service');

function signToken(payload){
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
}

// POST /auth/register
 async function register(req, res) {
    try {
        const {name , email, password, phone_number, code} = req.body;
        //1. Validate input
        if(!name || !email || !password){
            return res.status(400).json({message: "Name, email, and password are required"});
        }
        //2. Check if user already exists
        const [existingUser] = await pool.query(
            'SELECT user_id FROM `user` WHERE email = ? LIMIT 1',
            [email]
        )
        if(existingUser.length > 0){
            return res.status(409).json({message: "User already exists"});
        }
        //3. Hash password
        // const hashedPassword = await bcrypt.hash(password, 10);

        const roleCode = code || 'STUDENT';
        const [roleRows] = await pool.query(
            'SELECT code FROM role WHERE code = ? LIMIT 1',
            [roleCode]
        );
        if (roleRows.length === 0) {
            return res.status(400).json({
                message: `Invalid role code: ${roleCode}. Please use a code that exists in the role table.`
            });
        }

        //4. Insert new user into database
        const [result] = await pool.query(
            'INSERT INTO `user` (name, email, password, phone_number, code, is_deleted, is_oauth2, created_by) VALUES (?, ?, ?, ?, ?, 0, 0, ?)',
            [name, email, password, phone_number || null, roleCode, 'anonymousUser']
        )

        return res.status(201).json({message: "User registered successfully ", userId: result.insertId});
    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({message: "Internal server error", error: error.message});

    }
}
// POST /auth/login
async function login(req, res){
    try {
        const { email, password } = req.body;
        
        if(!email || ! password){
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const [rows] = await pool.query(
            "SELECT user_id, email, password, name FROM `user` WHERE email = ? LIMIT 1 ",
            [email]
        )
        if(rows.length === 0){
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];
        // const ok = await bcrypt.compare(String(password ?? ''), String(user.password ?? ''));
        const ok = password === user.password;

        if(!ok){
            return res.status(401).json({message: "Invalid email or password"})
        }

        const token = signToken({ user_id: user.user_id, email: user.email});

        return res.json({
            accessToken: token,
            user: {
                user_id: user.user_id,
                email: user.email,
                name: user.name
            }
        })
    }
    catch(error){
        console.error('Error during login:', error);    
        return res.status(500).json({ message: 'Internal server error' });}
    }

// POST /auth/forgot-password
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        // 1. Validate input
        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }

        // 2. Kiểm tra user có tồn tại không
        const [userRows] = await pool.query(
            'SELECT user_id, email, name FROM `user` WHERE email = ? AND is_deleted = 0 LIMIT 1',
            [email]
        );

        // Luôn trả về success message để tránh việc kẻ xấu biết email có tồn tại không
        if (userRows.length === 0) {
            return res.status(200).json({
                message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.'
            });
        }

        const user = userRows[0];

        // 3. Tạo reset token (random 32 bytes)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 4. Hash token trước khi lưu vào database (bảo mật)
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // 5. Token expires sau 15 phút
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // 6. Xóa các token cũ của user này (nếu có)
        await pool.query(
            'DELETE FROM password_reset_tokens WHERE user_id = ?',
            [user.user_id]
        );

        // 7. Lưu token mới vào database
        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
            [user.user_id, user.email, hashedToken, expiresAt]
        );

        // 8. Gửi email với token chưa hash
        await sendResetPasswordEmail(user.email, resetToken, user.name);

        return res.status(200).json({
            message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.'
        });

    } catch (error) {
        console.error('Error in forgotPassword:', error);
        return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau.' });
    }
}

// POST /auth/reset-password
async function resetPassword(req, res) {
    try {
        const { token, newPassword } = req.body;

        // 1. Validate input
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token và mật khẩu mới là bắt buộc' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        // 2. Hash token để so sánh với database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 3. Tìm token trong database
        const [tokenRows] = await pool.query(
            `SELECT * FROM password_reset_tokens
             WHERE token = ? AND used = 0 AND expires_at > NOW()
             LIMIT 1`,
            [hashedToken]
        );

        if (tokenRows.length === 0) {
            return res.status(400).json({
                message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.'
            });
        }

        const resetRecord = tokenRows[0];

        // 4. Hash mật khẩu mới (LƯU Ý: Nên sử dụng bcrypt trong production)
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        const passwordToSave = newPassword;

        // 5. Cập nhật mật khẩu mới cho user
        await pool.query(
            'UPDATE `user` SET password = ?, modified_date = NOW() WHERE user_id = ?',
            [passwordToSave, resetRecord.user_id]
        );

        // 6. Đánh dấu token đã được sử dụng
        await pool.query(
            'UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
            [resetRecord.id]
        );

        return res.status(200).json({
            message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.'
        });

    } catch (error) {
        console.error('Error in resetPassword:', error);
        return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau.' });
    }
}

module.exports = {
    login,
    register,
    forgotPassword,
    resetPassword
};