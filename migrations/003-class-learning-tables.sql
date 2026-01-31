-- Migration: Class Learning Tables
-- Căn chỉnh theo schema vietsignschool.sql
-- class_room dùng content (không phải class_room_name)
-- part_view đã tồn tại (không cần lesson_view)

-- =====================================================
-- 1. Cập nhật bảng class_room - chỉ thêm cột mới nếu chưa có
-- Schema: class_room_id, content, class_code, class_level, status,
--         teacher_id, school_id, image_location, thumbnail_path,
--         description, is_teacher_created, slug
-- =====================================================

-- Thêm is_active nếu chưa có
ALTER TABLE `class_room`
ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 1;

-- =====================================================
-- 2. Bảng class_student (Đã tồn tại)
-- Schema: class_student_id, class_room_id, user_id, created_date, modified_date
-- =====================================================

-- Thêm status nếu chưa có
ALTER TABLE `class_student`
ADD COLUMN IF NOT EXISTS `status` ENUM('ACTIVE', 'INACTIVE', 'LEFT') DEFAULT 'ACTIVE';

-- =====================================================
-- 3. Bảng class_teacher (Đã tồn tại)
-- Schema: class_teacher_id, class_room_id, user_id, created_date, modified_date
-- =====================================================

-- Thêm is_primary (giáo viên chủ nhiệm) nếu chưa có
ALTER TABLE `class_teacher`
ADD COLUMN IF NOT EXISTS `is_primary` TINYINT(1) DEFAULT 0 COMMENT 'Giáo viên chủ nhiệm';

-- =====================================================
-- 4. Bảng lesson (Đã tồn tại)
-- Schema: lesson_id, lesson_name, class_room_id, image_location, video_location
-- =====================================================

-- Thêm các cột mới nếu cần
ALTER TABLE `lesson`
ADD COLUMN IF NOT EXISTS `description` TEXT;

ALTER TABLE `lesson`
ADD COLUMN IF NOT EXISTS `order_index` INT DEFAULT 0 COMMENT 'Thứ tự bài học';

ALTER TABLE `lesson`
ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 1;

-- =====================================================
-- 5. Bảng part (Đã tồn tại)
-- Schema: part_id, part_name, lesson_id
-- =====================================================

-- Thêm các cột mới nếu cần
ALTER TABLE `part`
ADD COLUMN IF NOT EXISTS `description` TEXT;

ALTER TABLE `part`
ADD COLUMN IF NOT EXISTS `order_index` INT DEFAULT 0;

ALTER TABLE `part`
ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 1;

-- =====================================================
-- 6. Bảng part_image (Đã tồn tại)
-- Schema: part_image_id, part_id, image_location
-- =====================================================
-- Không cần thay đổi

-- =====================================================
-- 7. Bảng part_video (Đã tồn tại)
-- Schema: part_video_id, part_id, video_location
-- =====================================================
-- Không cần thay đổi

-- =====================================================
-- 8. Bảng part_view (Đã tồn tại - dùng cho tiến độ)
-- Schema: part_view_id, user_id, part_id, lesson_id, last_viewed_at, view_count
-- =====================================================

-- Thêm completed nếu chưa có
ALTER TABLE `part_view`
ADD COLUMN IF NOT EXISTS `completed` TINYINT(1) DEFAULT 0;

ALTER TABLE `part_view`
ADD COLUMN IF NOT EXISTS `progress_percent` DECIMAL(5,2) DEFAULT 0;

-- =====================================================
-- 9. Bảng topic (Đã tồn tại)
-- Schema: topic_id, content, description, image_location, video_location,
--         is_private, class_room_id, created_id
-- =====================================================

-- Thêm is_active nếu chưa có
ALTER TABLE `topic`
ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 1;

-- =====================================================
-- 10. Bảng vocabulary (Đã tồn tại)
-- Schema: vocabulary_id, content, description, topic_id, vocabulary_type,
--         status, is_private, class_room_id, lesson_id, part_id,
--         images_path, videos_path, slug, note, created_id
-- =====================================================
-- Không cần thay đổi - schema đã đầy đủ

-- =====================================================
-- 11. Bảng vocabulary_view (Đã tồn tại)
-- Schema: vocabulary_view_id, user_id, vocabulary_id, last_viewed_at, view_count
-- =====================================================
-- Không cần thay đổi

-- =====================================================
-- 12. Bảng class_learning_progress (Tiến độ học theo lớp) - Tạo mới
-- =====================================================
CREATE TABLE IF NOT EXISTS `class_learning_progress` (
    `progress_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `class_room_id` BIGINT NOT NULL,
    `total_lessons` INT DEFAULT 0,
    `completed_lessons` INT DEFAULT 0,
    `total_parts` INT DEFAULT 0,
    `completed_parts` INT DEFAULT 0,
    `total_vocabularies` INT DEFAULT 0,
    `learned_vocabularies` INT DEFAULT 0,
    `last_activity_at` DATETIME,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_class` (`user_id`, `class_room_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_class_room` (`class_room_id`),
    CONSTRAINT `fk_progress_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_progress_class_room` FOREIGN KEY (`class_room_id`) REFERENCES `class_room` (`class_room_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. Index tối ưu
-- =====================================================
CREATE INDEX IF NOT EXISTS `idx_class_room_level` ON `class_room`(`class_level`);
CREATE INDEX IF NOT EXISTS `idx_class_room_code` ON `class_room`(`class_code`);
CREATE INDEX IF NOT EXISTS `idx_class_room_status` ON `class_room`(`status`);

CREATE INDEX IF NOT EXISTS `idx_lesson_class_room` ON `lesson`(`class_room_id`);
CREATE INDEX IF NOT EXISTS `idx_lesson_order` ON `lesson`(`class_room_id`, `order_index`);

CREATE INDEX IF NOT EXISTS `idx_part_lesson` ON `part`(`lesson_id`);
CREATE INDEX IF NOT EXISTS `idx_part_order` ON `part`(`lesson_id`, `order_index`);

CREATE INDEX IF NOT EXISTS `idx_topic_class_room` ON `topic`(`class_room_id`);
CREATE INDEX IF NOT EXISTS `idx_topic_private` ON `topic`(`is_private`);

CREATE INDEX IF NOT EXISTS `idx_vocabulary_topic` ON `vocabulary`(`topic_id`);
CREATE INDEX IF NOT EXISTS `idx_vocabulary_class_room` ON `vocabulary`(`class_room_id`);
CREATE INDEX IF NOT EXISTS `idx_vocabulary_lesson` ON `vocabulary`(`lesson_id`);
CREATE INDEX IF NOT EXISTS `idx_vocabulary_status` ON `vocabulary`(`status`);
CREATE INDEX IF NOT EXISTS `idx_vocabulary_type` ON `vocabulary`(`vocabulary_type`);

-- =====================================================
-- 14. View thống kê lớp học
-- class_room dùng content thay vì class_room_name
-- =====================================================
CREATE OR REPLACE VIEW `v_class_room_stats` AS
SELECT
    c.class_room_id,
    c.content AS class_name,
    c.class_level,
    c.class_code,
    c.status,
    c.is_active,
    c.teacher_id,
    c.school_id,
    COUNT(DISTINCT cs.user_id) AS student_count,
    COUNT(DISTINCT ct.user_id) AS teacher_count,
    COUNT(DISTINCT l.lesson_id) AS lesson_count,
    COUNT(DISTINCT t.topic_id) AS topic_count,
    COUNT(DISTINCT v.vocabulary_id) AS vocabulary_count
FROM class_room c
LEFT JOIN class_student cs ON c.class_room_id = cs.class_room_id
LEFT JOIN class_teacher ct ON c.class_room_id = ct.class_room_id
LEFT JOIN lesson l ON c.class_room_id = l.class_room_id
LEFT JOIN topic t ON c.class_room_id = t.class_room_id
LEFT JOIN vocabulary v ON c.class_room_id = v.class_room_id AND v.status = 'APPROVED'
GROUP BY c.class_room_id;

-- =====================================================
-- 15. View thống kê bài học theo lớp
-- =====================================================
CREATE OR REPLACE VIEW `v_lesson_stats` AS
SELECT
    l.lesson_id,
    l.lesson_name,
    l.class_room_id,
    c.content AS class_name,
    l.order_index,
    COUNT(DISTINCT p.part_id) AS part_count,
    COUNT(DISTINCT v.vocabulary_id) AS vocabulary_count
FROM lesson l
LEFT JOIN class_room c ON l.class_room_id = c.class_room_id
LEFT JOIN part p ON l.lesson_id = p.lesson_id
LEFT JOIN vocabulary v ON l.lesson_id = v.lesson_id AND v.status = 'APPROVED'
GROUP BY l.lesson_id;

-- =====================================================
-- 16. View tiến độ học sinh theo lớp
-- =====================================================
CREATE OR REPLACE VIEW `v_student_class_progress` AS
SELECT
    cs.class_student_id,
    cs.user_id AS student_id,
    cs.class_room_id,
    c.content AS class_name,
    c.class_level,
    u.name AS student_name,
    u.email AS student_email,
    COALESCE(clp.completed_lessons, 0) AS completed_lessons,
    COALESCE(clp.total_lessons, 0) AS total_lessons,
    COALESCE(clp.completed_parts, 0) AS completed_parts,
    COALESCE(clp.total_parts, 0) AS total_parts,
    COALESCE(clp.learned_vocabularies, 0) AS learned_vocabularies,
    COALESCE(clp.total_vocabularies, 0) AS total_vocabularies,
    clp.last_activity_at,
    cs.created_date AS joined_at
FROM class_student cs
JOIN class_room c ON cs.class_room_id = c.class_room_id
JOIN `user` u ON cs.user_id = u.user_id
LEFT JOIN class_learning_progress clp ON cs.user_id = clp.user_id AND cs.class_room_id = clp.class_room_id
WHERE u.is_deleted = 0;

-- =====================================================
-- 17. View danh sách học sinh theo lớp
-- =====================================================
CREATE OR REPLACE VIEW `v_class_students` AS
SELECT
    cs.class_student_id,
    cs.class_room_id,
    cs.user_id AS student_id,
    u.name AS student_name,
    u.email AS student_email,
    u.avatar_location AS avatar,
    cs.status,
    cs.created_date AS joined_at,
    (SELECT COUNT(*) FROM part_view pv WHERE pv.user_id = cs.user_id) AS parts_viewed,
    (SELECT COUNT(*) FROM vocabulary_view vv WHERE vv.user_id = cs.user_id) AS vocabularies_viewed
FROM class_student cs
JOIN `user` u ON cs.user_id = u.user_id
WHERE u.is_deleted = 0;

-- =====================================================
-- 18. View danh sách giáo viên theo lớp
-- =====================================================
CREATE OR REPLACE VIEW `v_class_teachers` AS
SELECT
    ct.class_teacher_id,
    ct.class_room_id,
    ct.user_id AS teacher_id,
    u.name AS teacher_name,
    u.email AS teacher_email,
    u.avatar_location AS avatar,
    ct.is_primary,
    ct.created_date AS assigned_at
FROM class_teacher ct
JOIN `user` u ON ct.user_id = u.user_id
WHERE u.is_deleted = 0;

-- =====================================================
-- 19. View từ vựng đầy đủ thông tin
-- =====================================================
CREATE OR REPLACE VIEW `v_vocabulary_full` AS
SELECT
    v.vocabulary_id,
    v.content,
    v.description,
    v.vocabulary_type,
    v.slug,
    v.status,
    v.is_private,
    v.images_path,
    v.videos_path,
    v.note,
    v.topic_id,
    t.content AS topic_name,
    v.lesson_id,
    l.lesson_name,
    v.part_id,
    p.part_name,
    v.class_room_id,
    c.content AS class_name,
    v.created_id AS creator_id,
    u.name AS creator_name,
    v.created_by,
    v.created_date,
    v.modified_by,
    v.modified_date,
    COALESCE(vv_stats.total_views, 0) AS total_views
FROM vocabulary v
LEFT JOIN topic t ON v.topic_id = t.topic_id
LEFT JOIN lesson l ON v.lesson_id = l.lesson_id
LEFT JOIN part p ON v.part_id = p.part_id
LEFT JOIN class_room c ON v.class_room_id = c.class_room_id
LEFT JOIN `user` u ON v.created_id = u.user_id
LEFT JOIN (
    SELECT vocabulary_id, SUM(view_count) AS total_views
    FROM vocabulary_view
    GROUP BY vocabulary_id
) vv_stats ON v.vocabulary_id = vv_stats.vocabulary_id;

-- =====================================================
-- 20. View chủ đề đầy đủ thông tin
-- =====================================================
CREATE OR REPLACE VIEW `v_topic_full` AS
SELECT
    t.topic_id,
    t.content AS name,
    t.description,
    t.image_location,
    t.video_location,
    t.is_private,
    t.class_room_id,
    c.content AS class_name,
    t.created_id AS creator_id,
    u.name AS creator_name,
    t.created_by,
    t.created_date,
    t.modified_by,
    t.modified_date,
    COUNT(DISTINCT v.vocabulary_id) AS vocabulary_count
FROM topic t
LEFT JOIN class_room c ON t.class_room_id = c.class_room_id
LEFT JOIN `user` u ON t.created_id = u.user_id
LEFT JOIN vocabulary v ON t.topic_id = v.topic_id AND v.status = 'APPROVED'
GROUP BY t.topic_id;

-- =====================================================
-- 21. View bài học đầy đủ với parts
-- =====================================================
CREATE OR REPLACE VIEW `v_lesson_full` AS
SELECT
    l.lesson_id,
    l.lesson_name,
    l.description,
    l.class_room_id,
    c.content AS class_name,
    l.image_location,
    l.video_location,
    l.order_index,
    l.is_active,
    l.created_by,
    l.created_date,
    l.modified_by,
    l.modified_date,
    COUNT(DISTINCT p.part_id) AS part_count,
    COUNT(DISTINCT v.vocabulary_id) AS vocabulary_count
FROM lesson l
LEFT JOIN class_room c ON l.class_room_id = c.class_room_id
LEFT JOIN part p ON l.lesson_id = p.lesson_id
LEFT JOIN vocabulary v ON l.lesson_id = v.lesson_id AND v.status = 'APPROVED'
GROUP BY l.lesson_id;

-- =====================================================
-- 22. View tiến độ xem part của user
-- =====================================================
CREATE OR REPLACE VIEW `v_user_part_progress` AS
SELECT
    pv.part_view_id,
    pv.user_id,
    pv.part_id,
    p.part_name,
    pv.lesson_id,
    l.lesson_name,
    c.class_room_id,
    c.content AS class_name,
    pv.view_count,
    pv.completed,
    pv.progress_percent,
    pv.last_viewed_at,
    pv.created_date
FROM part_view pv
JOIN part p ON pv.part_id = p.part_id
JOIN lesson l ON pv.lesson_id = l.lesson_id
LEFT JOIN class_room c ON l.class_room_id = c.class_room_id;
