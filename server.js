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

// Kết nối và đồng bộ hóa database SQLite
sequelize.sync({ alter: true }) // alter: true is convenient for development but can be risky in production.
  .then(() => console.log('Kết nối và đồng bộ database thành công.'))
  .catch(err => console.error('Không thể kết nối hoặc đồng bộ database:', err));

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

app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

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
