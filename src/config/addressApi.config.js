/**
 * Cấu hình API địa chỉ Việt Nam
 * API Documentation: https://provinces.open-api.vn/api/v2/redoc
 *
 * API này cung cấp danh sách đầy đủ các tỉnh/thành phố và phường/xã của Việt Nam
 * Theo cấu trúc hành chính mới: Tỉnh/Thành phố → Phường/Xã 
 */

const ADDRESS_API_CONFIG = {
  // Base URL của API
  baseURL: 'https://provinces.open-api.vn/api',

  // Các endpoints
  endpoints: {
    // Lấy tất cả tỉnh/thành phố
    getAllProvinces: '/p',

    // Lấy tất cả tỉnh/thành phố với phường/xã (nội bộ sử dụng depth=3 để flatten từ API gốc)
    getProvincesWithWards: '/p?depth=3',

    // Endpoint depth=3 để lấy dữ liệu đầy đủ từ API gốc (sẽ được flatten thành 2 cấp)
    getProvincesWithDistrictsAndWards: '/p?depth=3',

    // Lấy chi tiết tỉnh/thành phố theo code
    getProvinceByCode: (code) => `/p/${code}`,

    // Lấy chi tiết tỉnh/thành phố với phường/xã (nội bộ sử dụng depth=3 để flatten)
    getProvinceWithDistrictsAndWards: (code) => `/p/${code}?depth=3`,

    // Lấy tất cả phường/xã
    getAllWards: '/w',

    // Lấy chi tiết phường/xã theo code
    getWardByCode: (code) => `/w/${code}`,

    // Tìm kiếm theo tên
    search: (query) => `/p/search/?q=${encodeURIComponent(query)}`
  },

  // Timeout cho request (ms)
  timeout: 10000,

  // Cache duration (ms) - 24 giờ
  cacheDuration: 24 * 60 * 60 * 1000
};

/**
 * Cấu trúc dữ liệu trả về (đã flatten )
 */
const DATA_STRUCTURE = {
  province: {
    name: 'string',           // Tên tỉnh/thành phố (VD: "Thành phố Hà Nội")
    code: 'number',           // Mã tỉnh/thành phố (VD: 1)
    division_type: 'string',  // Loại đơn vị hành chính (VD: "thành phố trung ương")
    codename: 'string',       // Tên không dấu (VD: "thanh_pho_ha_noi")
    phone_code: 'number',     // Mã điện thoại vùng (VD: 24)
    wards: 'array'            // Danh sách phường/xã (liên kết trực tiếp với province)
  },

  ward: {
    name: 'string',           // Tên phường/xã (VD: "Phường Phúc Xá")
    code: 'number',           // Mã phường/xã (VD: 1)
    division_type: 'string',  // Loại đơn vị hành chính (VD: "phường")
    codename: 'string',       // Tên không dấu (VD: "phuong_phuc_xa")
    province_code: 'number'   // Mã tỉnh/thành phố (liên kết trực tiếp - không qua quận)
  }
};

/**
 * Ví dụ sử dụng
 */
const USAGE_EXAMPLES = {
  // Lấy tất cả tỉnh/thành phố
  getAllProvinces: 'GET https://provinces.open-api.vn/api/p',

  // Lấy tỉnh/thành phố với phường/xã (depth=3 sẽ được flatten thành 2 cấp)
  getProvincesWithWards: 'GET https://provinces.open-api.vn/api/p?depth=3',

  // Lấy chi tiết Hà Nội với phường/xã (code = 1)
  getHanoiDetails: 'GET https://provinces.open-api.vn/api/p/1?depth=3',

  // Tìm kiếm
  search: 'GET https://provinces.open-api.vn/api/p/search/?q=Hà Nội'
};

module.exports = {
  ADDRESS_API_CONFIG,
  DATA_STRUCTURE,
  USAGE_EXAMPLES
};
