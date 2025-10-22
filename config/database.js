const { Sequelize } = require('sequelize');
const path = require('path');

// Khởi tạo Sequelize để kết nối với file SQLite
// File database.sqlite sẽ được tạo ở thư mục gốc của dự án
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false // Tắt logging các câu lệnh SQL ra console cho gọn
});

module.exports = sequelize;
