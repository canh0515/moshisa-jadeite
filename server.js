// Import các thư viện cần thiết
require('dotenv').config(); // Để đọc file .env
const express = require('express');
const path = require('path');
const sequelize = require('./config/database');
const expressLayouts = require('express-ejs-layouts'); // Thêm dòng này
const loadSettings = require('./middleware/loadSettings');
const session = require('express-session');
const flash = require('connect-flash'); // Thêm connect-flash

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 3000;

// --- Model Associations ---
// Định nghĩa các mối quan hệ TRƯỚC KHI đồng bộ database
const Product = require('./models/product');
const Category = require('./models/category');
Product.belongsToMany(Category, { through: 'ProductCategory', onDelete: 'CASCADE' });
Category.belongsToMany(Product, { through: 'ProductCategory', onDelete: 'CASCADE' });

// Sử dụng express-ejs-layouts
app.use(expressLayouts);                        // Thêm dòng này
app.set('layout', 'layouts/main');              // Thêm dòng này: chỉ định layout mặc định (cho trang người dùng)

// Cấu hình template engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cấu hình để phục vụ các file tĩnh từ thư mục 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware để xử lý dữ liệu form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cấu hình session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Đặt là true nếu bạn dùng HTTPS
}));

// Sử dụng connect-flash
app.use(flash());

// Sử dụng middleware để tải cài đặt cho mọi request
app.use(loadSettings);

// Import và sử dụng routes
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

// Khai báo route cho admin TRƯỚC route chung để tránh bị route động "/:slug" bắt mất.
app.use('/admin', adminRoutes);
app.use('/', indexRoutes);

// Hàm khởi động server
const startServer = async () => {
  try {
    // Kết nối và đồng bộ hóa database SQLite
    // Đã chuyển sang dùng Migrations, không cần sync ở đây nữa.
    // await sequelize.sync({ alter: true });
    // Chỉ cần xác thực kết nối là đủ.
    await sequelize.authenticate();
    console.log('Kết nối và đồng bộ database thành công.');

    // Khởi động server CHỈ SAU KHI đồng bộ thành công
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError' && err.errors && err.errors.some(e => e.path === 'id' && e.validatorKey === 'not_unique')) {
      console.error('--------------------------------------------------------------------');
      console.error('LỖI ĐỒNG BỘ DATABASE: Phát hiện vi phạm ràng buộc UNIQUE trên cột ID.');
      console.error('Điều này xảy ra khi `sequelize.sync({ alter: true })` cố gắng thay đổi cấu trúc bảng');
      console.error('nhưng dữ liệu hiện có trong bảng `Products` (hoặc một bảng khác) chứa các giá trị ID trùng lặp hoặc NULL.');
      console.error('Để khắc phục mà không xóa database, bạn cần:');
      console.error('1. Kết nối trực tiếp vào database SQLite của bạn (thường là file `.sqlite`).');
      console.error('2. Kiểm tra và sửa/xóa các bản ghi có ID trùng lặp hoặc ID là NULL.');
      console.error('   - Tìm ID trùng lặp: `SELECT id, COUNT(*) FROM Products GROUP BY id HAVING COUNT(*) > 1;`');
      console.error('   - Tìm ID là NULL: `SELECT * FROM Products WHERE id IS NULL;`');
      console.error('Chi tiết lỗi gốc:', err.parent);
      console.error('--------------------------------------------------------------------');
    } else {
      console.error('Không thể kết nối hoặc đồng bộ database:', err);
    }
  }
};

// Bắt các lỗi không được xử lý (uncaught exceptions) để ghi log trước khi PM2 khởi động lại
process.on('uncaughtException', (err, origin) => {
  console.error('--------------------');
  console.error('UNCAUGHT EXCEPTION!');
  console.error(`Caught exception: ${err}\n` + `Exception origin: ${origin}`);
  console.error('--------------------');
  // PM2 sẽ tự động khởi động lại process. Không cần process.exit(1) ở đây.
});

// Bắt các promise rejection không được xử lý
process.on('unhandledRejection', (reason, promise) => {
  console.error('--------------------');
  console.error('UNHANDLED REJECTION!');
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('--------------------');
});

// Gọi hàm để khởi động server
startServer();
