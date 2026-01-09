/**
 * Controller xử lý các request liên quan đến địa chỉ Việt Nam
 */

const addressService = require('../services/address.service');

/**
 * GET /address/provinces
 * Lấy danh sách tất cả tỉnh/thành phố
 */
async function getProvinces(req, res) {
  try {
    const { depth } = req.query;

    let provinces;
    if (depth === '2') {
      provinces = await addressService.getProvincesWithWards();
    } else {
      provinces = await addressService.getAllProvinces();
    }

    return res.json({
      total: provinces.length,
      provinces
    });
  } catch (error) {
    console.error('Error getting provinces:', error);
    return res.status(500).json({
      message: 'Lỗi khi lấy danh sách tỉnh/thành phố',
      error: error.message
    });
  }
}

/**
 * GET /address/provinces/:code
 * Lấy chi tiết tỉnh/thành phố theo mã
 */
async function getProvinceByCode(req, res) {
  try {
    const { code } = req.params;
    const { depth = '1' } = req.query;

    const province = await addressService.getProvinceByCode(
      parseInt(code),
      parseInt(depth)
    );

    if (!province) {
      return res.status(404).json({
        message: 'Không tìm thấy tỉnh/thành phố'
      });
    }

    return res.json(province);
  } catch (error) {
    console.error('Error getting province:', error);
    return res.status(500).json({
      message: 'Lỗi khi lấy thông tin tỉnh/thành phố',
      error: error.message
    });
  }
}

/**
 * GET /address/wards
 * Lấy danh sách tất cả phường/xã
 */
async function getWards(req, res) {
  try {
    const { province_code } = req.query;

    let wards;
    if (province_code) {
      // Lấy phường/xã theo tỉnh/thành phố
      wards = await addressService.getWardsByProvince(parseInt(province_code));
    } else {
      // Lấy tất cả phường/xã
      wards = await addressService.getAllWards();
    }

    return res.json({
      total: wards.length,
      wards
    });
  } catch (error) {
    console.error('Error getting wards:', error);
    return res.status(500).json({
      message: 'Lỗi khi lấy danh sách phường/xã',
      error: error.message
    });
  }
}

/**
 * GET /address/wards/:code
 * Lấy chi tiết phường/xã theo mã
 */
async function getWardByCode(req, res) {
  try {
    const { code } = req.params;

    const ward = await addressService.getWardByCode(parseInt(code));

    if (!ward) {
      return res.status(404).json({
        message: 'Không tìm thấy phường/xã'
      });
    }

    return res.json(ward);
  } catch (error) {
    console.error('Error getting ward:', error);
    return res.status(500).json({
      message: 'Lỗi khi lấy thông tin phường/xã',
      error: error.message
    });
  }
}

/**
 * GET /address/search
 * Tìm kiếm tỉnh/thành phố theo tên
 */
async function searchProvinces(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    const results = await addressService.searchProvinces(q);

    return res.json({
      query: q,
      total: results.length,
      results
    });
  } catch (error) {
    console.error('Error searching provinces:', error);
    return res.status(500).json({
      message: 'Lỗi khi tìm kiếm',
      error: error.message
    });
  }
}

/**
 * POST /address/format
 * Format địa chỉ đầy đủ từ các mã
 */
async function formatAddress(req, res) {
  try {
    const { ward_code, province_code, street } = req.body;

    if (!province_code) {
      return res.status(400).json({
        message: 'province_code là bắt buộc'
      });
    }

    const fullAddress = await addressService.formatFullAddress(
      ward_code ? parseInt(ward_code) : null,
      parseInt(province_code),
      street
    );

    return res.json({
      full_address: fullAddress,
      components: {
        street,
        ward_code,
        province_code
      }
    });
  } catch (error) {
    console.error('Error formatting address:', error);
    return res.status(500).json({
      message: 'Lỗi khi format địa chỉ',
      error: error.message
    });
  }
}

/**
 * POST /address/clear-cache
 * Xóa cache (Admin only)
 */
async function clearCache(req, res) {
  try {
    addressService.clearCache();

    return res.json({
      message: 'Đã xóa cache địa chỉ thành công'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({
      message: 'Lỗi khi xóa cache',
      error: error.message
    });
  }
}

module.exports = {
  getProvinces,
  getProvinceByCode,
  getWards,
  getWardByCode,
  searchProvinces,
  formatAddress,
  clearCache
};
