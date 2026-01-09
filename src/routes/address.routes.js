/**
 * Routes cho API địa chỉ Việt Nam
 * Sử dụng data từ https://provinces.open-api.vn/api
 */

const express = require('express');
const {
  getProvinces,
  getProvinceByCode,
  getWards,
  getWardByCode,
  searchProvinces,
  formatAddress,
  clearCache
} = require('../controllers/address.controller');
const { authRequired } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/permission.middleware');

const router = express.Router();

// ==================== TỈNH/THÀNH PHỐ ====================

/**
 * @route   GET /address/provinces
 * @desc    Lấy danh sách tất cả tỉnh/thành phố
 * @query   depth - Độ sâu dữ liệu (1: chỉ tỉnh, 2: kèm phường/xã)
 * @access  Public
 * @example GET /address/provinces?depth=2
 */
router.get('/provinces', getProvinces);

/**
 * @route   GET /address/provinces/:code
 * @desc    Lấy chi tiết tỉnh/thành phố theo mã
 * @param   code - Mã tỉnh/thành phố
 * @query   depth - Độ sâu dữ liệu (1 hoặc 2)
 * @access  Public
 * @example GET /address/provinces/1?depth=2
 */
router.get('/provinces/:code', getProvinceByCode);

// ==================== PHƯỜNG/XÃ ====================

/**
 * @route   GET /address/wards
 * @desc    Lấy danh sách phường/xã
 * @query   province_code - Mã tỉnh/thành phố (optional, để lọc theo tỉnh)
 * @access  Public
 * @example GET /address/wards?province_code=1
 */
router.get('/wards', getWards);

/**
 * @route   GET /address/wards/:code
 * @desc    Lấy chi tiết phường/xã theo mã
 * @param   code - Mã phường/xã
 * @access  Public
 * @example GET /address/wards/1
 */
router.get('/wards/:code', getWardByCode);

// ==================== TÌM KIẾM & UTILITIES ====================

/**
 * @route   GET /address/search
 * @desc    Tìm kiếm tỉnh/thành phố theo tên
 * @query   q - Từ khóa tìm kiếm
 * @access  Public
 * @example GET /address/search?q=Hà Nội
 */
router.get('/search', searchProvinces);

/**
 * @route   POST /address/format
 * @desc    Format địa chỉ đầy đủ từ các mã
 * @body    { ward_code, province_code, street }
 * @access  Public
 * @example POST /address/format
 *          Body: { "province_code": 1, "ward_code": 1, "street": "Số 1 Đại Cồ Việt" }
 */
router.post('/format', formatAddress);

/**
 * @route   POST /address/clear-cache
 * @desc    Xóa cache địa chỉ (Admin only)
 * @access  Private - Admin only
 */
router.post('/clear-cache', authRequired, isAdmin, clearCache);

module.exports = router;
