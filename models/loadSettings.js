const Setting = require('../models/setting');

// Middleware để tải các cài đặt và cung cấp cho tất cả các view
const loadSettings = async (req, res, next) => {
  try {
    const settingsFromDB = await Setting.findAll();
    
    // Chuyển mảng các object [{key: 'site_name', value: '...'}, ...]
    // thành một object duy nhất { site_name: '...', logo_url: '...' }
    const settings = settingsFromDB.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    // Cung cấp các cài đặt mặc định nếu chưa có trong DB
    res.locals.settings = {
      site_name: 'Ngọc Việt Nam',
      logo_url: '/images/default-logo.png', // Cần có một logo mặc định
      footer_info: '© 2024 Ngọc Việt Nam Clone',
      ...settings // Ghi đè giá trị mặc định bằng giá trị từ DB (nếu có)
    };

    next();
  } catch (error) {
    console.error("Lỗi khi tải cài đặt:", error);
    next(error);
  }
};

module.exports = loadSettings;