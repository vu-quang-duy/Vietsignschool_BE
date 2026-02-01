-- ==========================================
-- Init SQL for Vietsignschool Database
-- ==========================================

-- Set character encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS Vietsignschool
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE Vietsignschool;

-- Grant permissions
GRANT ALL PRIVILEGES ON Vietsignschool.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- Log initialization
SELECT 'Database Vietsignschool initialized successfully!' as message;
