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
      phone_number: '1900 1234',
      banner_title: 'Vẻ đẹp tinh khôi từ ngọc trai',
      banner_subtitle: 'Khám phá những bộ sưu tập trang sức ngọc trai được chế tác tinh xảo, mang lại vẻ đẹp sang trọng và quý phái.',
      banner_button_text: 'Xem thêm...',
      banner_button_link: '#',
      featured_products_title: 'Sản phẩm nổi bật',
      testimonials_title: 'Khách hàng nói về chúng tôi',
      about_us_business_info: 'Nội dung giới thiệu về hộ kinh doanh...',
      about_us_phone: '09xx xxx xxx',
      about_us_address: 'Địa chỉ kinh doanh',
      about_us_email: 'email@example.com',
      footer_about_us_text: 'Đây là đoạn văn bản giới thiệu ngắn về cửa hàng của bạn, hiển thị ở chân trang. Bạn có thể chỉnh sửa nó trong trang Cài đặt.',
      carousel_slides: '[]', // Mặc định là một mảng rỗng dạng chuỗi
      chat_link: 'https://zalo.me/your_zalo_number', // Link Zalo hoặc Messenger
      color_primary: '#1a2d4c', // Màu chính (Xanh navy đậm)
      color_accent: '#c5a47e',  // Màu nhấn (Vàng gold)
      ...settings // Ghi đè giá trị mặc định bằng giá trị từ DB (nếu có)
    };

    next();
  } catch (error) {
    console.error("Lỗi khi tải cài đặt:", error);
    next(error);
  }
};

module.exports = loadSettings;