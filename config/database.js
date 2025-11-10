const { Sequelize } = require('sequelize');
require('dotenv').config(); // Đảm bảo các biến môi trường từ file .env được tải

// Cấu hình kết nối tới MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Tắt log SQL ra console cho môi trường production
  }
);

module.exports = sequelize;
