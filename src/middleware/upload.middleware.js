const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique: userId_timestamp_originalname
        const userId = req.user?.user_id || 'unknown';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');

        cb(null, `${userId}_${timestamp}_${sanitizedName}${ext}`);
    }
});

// File filter - chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
    // Kiểm tra loại file
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)'), false);
    }
};

// Cấu hình multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    }
});

// Middleware để xử lý lỗi upload
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Lỗi từ multer
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File quá lớn. Kích thước tối đa là 5MB'
            });
        }
        return res.status(400).json({
            message: `Lỗi upload: ${err.message}`
        });
    } else if (err) {
        // Lỗi khác
        return res.status(400).json({
            message: err.message || 'Lỗi khi upload file'
        });
    }
    next();
};

// Middleware để xóa file cũ khi upload file mới
const deleteOldAvatar = async (req, res, next) => {
    try {
        if (!req.user?.user_id) {
            return next();
        }

        const db = require('../db');
        const [userRows] = await db.query(
            'SELECT avatar_location FROM `user` WHERE user_id = ? LIMIT 1',
            [req.user.user_id]
        );

        if (userRows.length > 0 && userRows[0].avatar_location) {
            const oldAvatarPath = userRows[0].avatar_location;

            // Chỉ xóa nếu là file local (không phải URL từ cloud)
            if (oldAvatarPath.startsWith('/uploads/')) {
                const fullPath = path.join(__dirname, '../../public', oldAvatarPath);

                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log('Đã xóa avatar cũ:', fullPath);
                }
            }
        }
    } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Không block request nếu xóa file cũ bị lỗi
    }

    next();
};

module.exports = {
    upload,
    handleUploadError,
    deleteOldAvatar
};
