/**
 * Service để tương tác với API địa chỉ Việt Nam
 * https://provinces.open-api.vn/api/v2/redoc
 */

const axios = require('axios');
const { ADDRESS_API_CONFIG } = require('../config/addressApi.config');

// Cache đơn giản trong memory
const cache = new Map();

/**
 * Helper function để lấy dữ liệu từ cache hoặc API
 */
async function fetchWithCache(url, cacheKey) {
  // Kiểm tra cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ADDRESS_API_CONFIG.cacheDuration) {
    return cached.data;
  }

  // Fetch từ API
  try {
    const response = await axios.get(url, {
      timeout: ADDRESS_API_CONFIG.timeout
    });

    // Lưu vào cache
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error.message);
    throw new Error(`Không thể lấy dữ liệu từ API địa chỉ: ${error.message}`);
  }
}

/**
 * Lấy tất cả tỉnh/thành phố
 * @returns {Promise<Array>} Danh sách tỉnh/thành phố
 */
async function getAllProvinces() {
  const url = `${ADDRESS_API_CONFIG.baseURL}${ADDRESS_API_CONFIG.endpoints.getAllProvinces}`;
  return fetchWithCache(url, 'all-provinces');
}

/**
 * Lấy tất cả tỉnh/thành phố kèm phường/xã
 * @returns {Promise<Array>} Danh sách tỉnh/thành phố với phường/xã (đã flatten - bỏ cấp quận/huyện)
 */
async function getProvincesWithWards() {
  // Lấy tất cả tỉnh/thành phố với depth=3 từ API gốc (có cấu trúc 3 cấp: province > district > ward)
  // Sau đó flatten thành 2 cấp: province > ward
  const url = `${ADDRESS_API_CONFIG.baseURL}${ADDRESS_API_CONFIG.endpoints.getProvincesWithDistrictsAndWards}`;
  const provinces = await fetchWithCache(url, 'provinces-with-wards');

  // Flatten: gắn wards trực tiếp vào province, bỏ qua cấp district
  return provinces.map(province => ({
    ...province,
    wards: province.districts?.flatMap(district =>
      (district.wards || []).map(ward => ({
        ...ward,
        province_code: province.code
      }))
    ) || [],
    districts: undefined // Xóa cấp district
  }));
}

/**
 * Lấy chi tiết tỉnh/thành phố theo code
 * @param {number} code - Mã tỉnh/thành phố
 * @param {number} depth - Độ sâu (1: chỉ tỉnh, 2: kèm phường/xã)
 * @returns {Promise<Object>} Thông tin chi tiết tỉnh/thành phố
 */
async function getProvinceByCode(code, depth = 1) {
  let endpoint;
  if (depth === 2) {
    // Lấy province với depth=3 từ API gốc (có district), sau đó flatten thành 2 cấp
    endpoint = ADDRESS_API_CONFIG.endpoints.getProvinceWithDistrictsAndWards(code);
  } else {
    endpoint = ADDRESS_API_CONFIG.endpoints.getProvinceByCode(code);
  }

  const url = `${ADDRESS_API_CONFIG.baseURL}${endpoint}`;
  const province = await fetchWithCache(url, `province-${code}-depth-${depth}`);

  if (depth === 2 && province.districts) {
    // Flatten: gắn wards trực tiếp vào province, bỏ qua cấp district
    province.wards = province.districts.flatMap(district =>
      (district.wards || []).map(ward => ({
        ...ward,
        province_code: province.code
      }))
    );
    delete province.districts;
  }

  return province;
}

/**
 * Lấy tất cả phường/xã
 * @returns {Promise<Array>} Danh sách phường/xã
 */
async function getAllWards() {
  const url = `${ADDRESS_API_CONFIG.baseURL}${ADDRESS_API_CONFIG.endpoints.getAllWards}`;
  return fetchWithCache(url, 'all-wards');
}

/**
 * Lấy chi tiết phường/xã theo code
 * @param {number} code - Mã phường/xã
 * @returns {Promise<Object>} Thông tin chi tiết phường/xã
 */
async function getWardByCode(code) {
  const url = `${ADDRESS_API_CONFIG.baseURL}${ADDRESS_API_CONFIG.endpoints.getWardByCode(code)}`;
  return fetchWithCache(url, `ward-${code}`);
}

/**
 * Tìm kiếm tỉnh/thành phố theo tên
 * @param {string} query - Từ khóa tìm kiếm
 * @returns {Promise<Array>} Kết quả tìm kiếm
 */
async function searchProvinces(query) {
  const url = `${ADDRESS_API_CONFIG.baseURL}${ADDRESS_API_CONFIG.endpoints.search(query)}`;
  // Không cache kết quả tìm kiếm
  try {
    const response = await axios.get(url, {
      timeout: ADDRESS_API_CONFIG.timeout
    });
    return response.data;
  } catch (error) {
    console.error(`Error searching for "${query}":`, error.message);
    throw new Error(`Không thể tìm kiếm: ${error.message}`);
  }
}

/**
 * Lấy phường/xã theo mã tỉnh/thành phố
 * @param {number} provinceCode - Mã tỉnh/thành phố
 * @returns {Promise<Array>} Danh sách phường/xã
 */
async function getWardsByProvince(provinceCode) {
  const province = await getProvinceByCode(provinceCode, 2);
  return province.wards || [];
}

/**
 * Format địa chỉ đầy đủ
 * @param {number} wardCode - Mã phường/xã
 * @param {number} provinceCode - Mã tỉnh/thành phố
 * @param {string} street - Tên đường/số nhà
 * @returns {Promise<string>} Địa chỉ đầy đủ
 */
async function formatFullAddress(wardCode, provinceCode, street = '') {
  try {
    const [ward, province] = await Promise.all([
      wardCode ? getWardByCode(wardCode) : null,
      provinceCode ? getProvinceByCode(provinceCode) : null
    ]);

    const parts = [];
    if (street) parts.push(street);
    if (ward) parts.push(ward.name);
    if (province) parts.push(province.name);

    return parts.join(', ');
  } catch (error) {
    console.error('Error formatting address:', error.message);
    return street || '';
  }
}

/**
 * Xóa cache (hữu ích khi cần refresh dữ liệu)
 */
function clearCache() {
  cache.clear();
  console.log('Address API cache cleared');
}

module.exports = {
  getAllProvinces,
  getProvincesWithWards,
  getProvinceByCode,
  getAllWards,
  getWardByCode,
  searchProvinces,
  getWardsByProvince,
  formatFullAddress,
  clearCache
};
